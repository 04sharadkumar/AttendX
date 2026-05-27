import type { Request, Response } from "express";
import { pool } from "../config/db.js";

export const checkIn = async (req: Request, res: Response) => {
  try {
    const { user_id, check_in_time } = req.body;

    if (!user_id || !check_in_time) {
      return res.status(400).json({
        success: false,
        message: "user_id and check_in_time are required",
      });
    }

    const alreadyMarkedToday = await pool.query(
      `
  SELECT *
  FROM attendance_logs
  WHERE user_id = $1
  AND attendance_date = DATE($2::timestamp)
  ORDER BY created_at DESC
  LIMIT 1
  `,
      [user_id, check_in_time]
    );

    if (alreadyMarkedToday.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Attendance already marked for today",
        data: alreadyMarkedToday.rows[0],
      });
    }

    const result = await pool.query(
  `
  INSERT INTO attendance_logs
  (
    user_id,
    check_in_time,
    attendance_date,
    status
  )
  VALUES ($1, $2::timestamp, DATE($2::timestamp), 'PENDING')
  RETURNING *
  `,
  [user_id, check_in_time]
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

export const checkOut = async (req: Request, res: Response) => {
  try {
    const { attendance_id, check_out_time } = req.body;

    if (!attendance_id || !check_out_time) {
      return res.status(400).json({
        success: false,
        message: "attendance_id and check_out_time are required",
      });
    }

   const result = await pool.query(
  `
  UPDATE attendance_logs
  SET
    check_out_time = $1::timestamp,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = $2
  AND check_out_time IS NULL
  RETURNING *
  `,
  [check_out_time, attendance_id]
);

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found or already checked out",
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

export const getTodayAttendance = async (req: Request, res: Response) => {
  try {
    const { user_id } = req.params;
    const today = req.query.today as string | undefined;

    if (!today) {
      return res.status(400).json({
        success: false,
        message: "today query is required. Example: ?today=2026-05-26",
      });
    }

    const result = await pool.query(
      `
      SELECT *
      FROM attendance_logs
      WHERE user_id = $1
      AND attendance_date = $2
      ORDER BY created_at DESC
      LIMIT 1
      `,
      [user_id, today]
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

export const getUserAttendance = async (req: Request, res: Response) => {
  try {
    const { user_id } = req.params;

    const result = await pool.query(
      `
      SELECT *
      FROM attendance_logs
      WHERE user_id = $1
      ORDER BY attendance_date DESC, created_at DESC
      `,
      [user_id]
    );

    return res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.log("Get attendance error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get attendance",
    });
  }
};

export const getMonthlyAttendance = async (req: Request, res: Response) => {
  try {
    const { user_id } = req.params;
    const { month, year } = req.query;

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
      [user_id, Number(month), Number(year)]
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

export const approveAttendance = async (req: Request, res: Response) => {
  try {
    const { attendance_id } = req.params;

    const result = await pool.query(
      `
      UPDATE attendance_logs
      SET
        status = 'APPROVED',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
      `,
      [attendance_id]
    );

    if (result.rowCount === 0) {
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

export const rejectAttendance = async (req: Request, res: Response) => {
  try {
    const { attendance_id } = req.params;

    const result = await pool.query(
      `
      UPDATE attendance_logs
      SET
        status = 'REJECTED',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
      `,
      [attendance_id]
    );

    if (result.rowCount === 0) {
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

export const getMonthlyStats = async (req: Request, res: Response) => {
  try {
    const { user_id } = req.params;
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: "month and year are required",
      });
    }

    const presentResult = await pool.query(
      `
      SELECT COUNT(*) AS count
      FROM attendance_logs
      WHERE user_id = $1
      AND EXTRACT(MONTH FROM attendance_date) = $2
      AND EXTRACT(YEAR FROM attendance_date) = $3
      AND status IN ('PENDING', 'APPROVED')
      `,
      [user_id, Number(month), Number(year)]
    );

    const present = Number(presentResult.rows[0].count);

    const totalDaysTillToday = new Date(
      Number(year),
      Number(month),
      0
    ).getDate();

    const today = new Date();
    const isCurrentMonth =
      today.getMonth() + 1 === Number(month) &&
      today.getFullYear() === Number(year);

    const daysToCount = isCurrentMonth
      ? today.getDate()
      : totalDaysTillToday;

    const absent = Math.max(daysToCount - present, 0);

    return res.status(200).json({
      success: true,
      data: {
        present,
        absent,
        leave: 0,
      },
    });
  } catch (error) {
    console.log("Monthly stats error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get monthly stats",
    });
  }
};