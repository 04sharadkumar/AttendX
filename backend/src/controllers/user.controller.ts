import { Request, Response } from "express";
import { pool } from "../config/db.js";

// GET logged-in/user profile
export const getUserProfile = async (req: Request, res: Response) => {
  try {
    // Change this email later with logged-in user email from token/session
    const email = "sharad@gmail.com";

    const result = await pool.query(
      `
      SELECT 
        id,
        google_id,
        name,
        email,
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
      WHERE email = $1
      `,
      [email]
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

// GET user by email
export const getUserByEmail = async (req: Request, res: Response) => {
  try {
    const { email } = req.params;

    const result = await pool.query(
      `
      SELECT 
        id,
        google_id,
        name,
        email,
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
      WHERE email = $1
      `,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json(result.rows[0]);
  } catch (error) {
    console.log("Get User Error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// UPDATE user profile
export const updateUserProfile = async (req: Request, res: Response) => {
  try {
    const { email } = req.params;

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
      WHERE email = $7
      RETURNING 
        id,
        google_id,
        name,
        email,
        profile_pic,
        phone,
        location,
        department,
        shift_time,
        auth_provider,
        email_verified,
        created_at,
        updated_at
      `,
      [
        name,
        phone,
        location,
        department,
        shift_time,
        profile_pic,
        email,
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