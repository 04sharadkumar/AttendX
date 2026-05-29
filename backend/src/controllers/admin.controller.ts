import type { Request, Response } from "express";
import { pool } from "../config/db.js";

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