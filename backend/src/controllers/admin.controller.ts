import type { Request, Response } from "express";
import { pool } from "../config/db.js";

type AuthRequest = Request & {
  user?: {
    id: number;
    email: string;
    role: string;
  };
};

export const getAdminDashboard = async (
  req: Request,
  res: Response
) => {
  try {
    const totalEmployees = await pool.query(
      `
      SELECT COUNT(*) AS count
      FROM users
      WHERE role = 'user'
      `
    );


    const pendingApprovals = await pool.query(
      `
      SELECT COUNT(*) AS count
      FROM attendance_logs
      WHERE status = 'PENDING'
      `
    );

    const approvedToday = await pool.query(
      `
      SELECT COUNT(*) AS count
      FROM attendance_logs
      WHERE status = 'APPROVED'
      AND attendance_date = CURRENT_DATE
      `
    );

    const rejectedToday = await pool.query(
      `
      SELECT COUNT(*) AS count
      FROM attendance_logs
      WHERE status = 'REJECTED'
      AND attendance_date = CURRENT_DATE
      `
    );

    const presentToday = await pool.query(
      `
      SELECT COUNT(*) AS count
      FROM attendance_logs
      WHERE attendance_date = CURRENT_DATE
      `
    );

    return res.status(200).json({
      success: true,
      data: {
        totalEmployees: Number(totalEmployees.rows[0].count),
        pendingApprovals: Number(pendingApprovals.rows[0].count),
        approvedToday: Number(approvedToday.rows[0].count),
        rejectedToday: Number(rejectedToday.rows[0].count),
        presentToday: Number(presentToday.rows[0].count),
      },
    });
  } catch (error) {
    console.log("Admin dashboard error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load admin dashboard",
    });
  }
};

export const getPendingAttendance = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `
      SELECT 
        a.*,
        u.name,
        u.email,
        u.department,
        u.profile_pic
      FROM attendance_logs a
      JOIN users u ON u.id = a.user_id
      WHERE a.status = 'PENDING'
      ORDER BY a.created_at DESC
      `
    );

    return res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.log("Pending attendance error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch pending attendance",
    });
  }
};

export const approveAttendance = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user?.id;
    const { attendance_id } = req.params;

    const result = await pool.query(
      `
      UPDATE attendance_logs
      SET 
        status = 'APPROVED',
        approved_by = $1,
        approved_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
      `,
      [adminId, attendance_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Attendance approved",
      data: result.rows[0],
    });
  } catch (error) {
    console.log("Approve error:", error);
    return res.status(500).json({
      success: false,
      message: "Approval failed",
    });
  }
};

export const rejectAttendance = async (req: Request, res: Response) => {
  try {
    const { attendance_id } = req.params;
    const { rejection_reason } = req.body;

    const result = await pool.query(
      `
      UPDATE attendance_logs
      SET 
        status = 'REJECTED',
        rejection_reason = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
      `,
      [rejection_reason || "Rejected by admin", attendance_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Attendance rejected",
      data: result.rows[0],
    });
  } catch (error) {
    console.log("Reject error:", error);
    return res.status(500).json({
      success: false,
      message: "Reject failed",
    });
  }
};

export const getAllEmployees = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `
      SELECT 
        id,
        name,
        email,
        phone,
        location,
        department,
        shift_time,
        profile_pic,
        role,
        created_at
      FROM users
      WHERE role = 'user'
      ORDER BY created_at DESC
      `
    );

    return res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.log("Employees error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch employees",
    });
  }
};

export const getMonthlyReport = async (req: Request, res: Response) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: "month and year are required",
      });
    }

    const result = await pool.query(
      `
      SELECT
        u.id AS user_id,
        u.name,
        u.email,
        u.department,

        COUNT(a.id) AS total_marked_days,

        COUNT(a.id) FILTER (
          WHERE a.status = 'APPROVED'
        ) AS approved_days,

        COUNT(a.id) FILTER (
          WHERE a.status = 'PENDING'
        ) AS pending_days,

        COUNT(a.id) FILTER (
          WHERE a.status = 'REJECTED'
        ) AS rejected_days,

        COALESCE(SUM(a.total_minutes), 0) AS total_minutes

      FROM users u
      LEFT JOIN attendance_logs a
        ON a.user_id = u.id
        AND EXTRACT(MONTH FROM a.attendance_date) = $1
        AND EXTRACT(YEAR FROM a.attendance_date) = $2

      WHERE u.role = 'user'

      GROUP BY u.id, u.name, u.email, u.department
      ORDER BY u.name ASC
      `,
      [Number(month), Number(year)]
    );

    return res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.log("Monthly report error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch monthly report",
    });
  }
};