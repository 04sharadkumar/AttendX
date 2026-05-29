import { Request, Response } from "express";
import { pool } from "../config/db.js";

type AuthRequest = Request & {
  user?: {
    id: number;
    email: string;
  };
};

export const getUserProfile = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized user",
      });
    }

    const result = await pool.query(
      `
      SELECT 
        id,
        google_id,
        name,
        email,
        role,
        profile_pic,
        phone,
        location,
        department,
        shift_time,
        auth_provider,
        email_verified,
        created_at,
        updated_at
      FROM users
      WHERE id = $1
      `,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json(result.rows[0]);
  } catch (error) {
    console.log("Get User Profile Error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// UPDATE user profile
export const updateUserProfile = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized user",
      });
    }

    const {
      name,
      phone,
      location,
      department,
      shift_time,
      profile_pic,
    } = req.body;

    const result = await pool.query(
      `
      UPDATE users
      SET
        name = COALESCE($1, name),
        phone = COALESCE($2, phone),
        location = COALESCE($3, location),
        department = COALESCE($4, department),
        shift_time = COALESCE($5, shift_time),
        profile_pic = COALESCE($6, profile_pic),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING *
      `,
      [
        name,
        phone,
        location,
        department,
        shift_time,
        profile_pic,
        userId,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json({
      message: "Profile updated successfully",
      user: result.rows[0],
    });
  } catch (error) {
    console.log("Update User Error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};