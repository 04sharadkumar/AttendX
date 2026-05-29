import type { Request, Response } from "express";
import { pool } from "../config/db.js";

type AuthRequest = Request & {
  user?: {
    id: number;
    email: string;
  };
};

export const getTodayAttendance = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const result = await pool.query(
      `
      SELECT *
      FROM attendance_logs
      WHERE user_id = $1
      AND attendance_date = CURRENT_DATE
      ORDER BY created_at DESC
      LIMIT 1
      `,
      [userId]
    );

    return res.status(200).json({
      success: true,
      data: result.rows[0] || null,
    });
  } catch (error) {
    console.log("Get today attendance error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get today attendance",
    });
  }
};

export const checkIn = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const {
      check_in_latitude,
      check_in_longitude,
      check_in_accuracy,
      device_name,
      notes,
    } = req.body;

    const alreadyMarked = await pool.query(
      `
      SELECT *
      FROM attendance_logs
      WHERE user_id = $1
      AND attendance_date = CURRENT_DATE
      LIMIT 1
      `,
      [userId]
    );

    if (alreadyMarked.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Attendance already marked for today",
        data: alreadyMarked.rows[0],
      });
    }

    const result = await pool.query(
      `
      INSERT INTO attendance_logs
      (
        user_id,
        attendance_date,
        check_in_time,
        status,
        check_in_latitude,
        check_in_longitude,
        check_in_accuracy,
        device_name,
        notes
      )
      VALUES
      (
        $1,
        CURRENT_DATE,
        CURRENT_TIMESTAMP,
        'PENDING',
        $2,
        $3,
        $4,
        $5,
        $6
      )
      RETURNING *
      `,
      [
        userId,
        check_in_latitude || null,
        check_in_longitude || null,
        check_in_accuracy || null,
        device_name || null,
        notes || null,
      ]
    );

    return res.status(201).json({
      success: true,
      message: "Check-in saved",
      data: result.rows[0],
    });
  } catch (error) {
    console.log("Check-in error:", error);

    return res.status(500).json({
      success: false,
      message: "Check-in failed",
    });
  }
};

export const checkOut = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const {
      check_out_latitude,
      check_out_longitude,
      check_out_accuracy,
    } = req.body;

    const result = await pool.query(
      `
      UPDATE attendance_logs
      SET
        check_out_time = CURRENT_TIMESTAMP,
        total_minutes = FLOOR(
          EXTRACT(
            EPOCH FROM (CURRENT_TIMESTAMP - check_in_time)
          ) / 60
        ),
        check_out_latitude = $1,
        check_out_longitude = $2,
        check_out_accuracy = $3,
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $4
      AND attendance_date = CURRENT_DATE
      AND check_out_time IS NULL
      RETURNING *
      `,
      [
        check_out_latitude || null,
        check_out_longitude || null,
        check_out_accuracy || null,
        userId,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Active attendance not found or already checked out",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Check-out saved",
      data: result.rows[0],
    });
  } catch (error) {
    console.log("Check-out error:", error);

    return res.status(500).json({
      success: false,
      message: "Check-out failed",
    });
  }
};

export const getMonthlyAttendance = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId = req.user?.id;
    const { month, year } = req.query;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: "month and year are required",
      });
    }

    const result = await pool.query(
      `
      SELECT *
      FROM attendance_logs
      WHERE user_id = $1
      AND EXTRACT(MONTH FROM attendance_date) = $2
      AND EXTRACT(YEAR FROM attendance_date) = $3
      ORDER BY attendance_date ASC
      `,
      [userId, Number(month), Number(year)]
    );

    return res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.log("Monthly attendance error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get monthly attendance",
    });
  }
};

export const getMonthlyStats = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId = req.user?.id;
    const { month, year } = req.query;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: "month and year are required",
      });
    }

    const result = await pool.query(
      `
      SELECT
        COUNT(*) FILTER (
          WHERE status IN ('PENDING', 'APPROVED')
        ) AS present,

        COUNT(*) FILTER (
          WHERE status = 'APPROVED'
        ) AS approved,

        COUNT(*) FILTER (
          WHERE status = 'PENDING'
        ) AS pending,

        COUNT(*) FILTER (
          WHERE status = 'REJECTED'
        ) AS rejected,

        COALESCE(SUM(total_minutes), 0) AS total_minutes
      FROM attendance_logs
      WHERE user_id = $1
      AND EXTRACT(MONTH FROM attendance_date) = $2
      AND EXTRACT(YEAR FROM attendance_date) = $3
      `,
      [userId, Number(month), Number(year)]
    );

    return res.status(200).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.log("Monthly stats error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get monthly stats",
    });
  }
};

export const approveAttendance = async (
  req: AuthRequest,
  res: Response
) => {
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
    console.log("Approve attendance error:", error);

    return res.status(500).json({
      success: false,
      message: "Approval failed",
    });
  }
};

export const rejectAttendance = async (
  req: AuthRequest,
  res: Response
) => {
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
      [rejection_reason || null, attendance_id]
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
    console.log("Reject attendance error:", error);

    return res.status(500).json({
      success: false,
      message: "Reject failed",
    });
  }
};

