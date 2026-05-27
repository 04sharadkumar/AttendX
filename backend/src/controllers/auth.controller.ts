// controllers/auth.controller.ts

import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import { pool } from "../config/db.js";
import { createToken } from "../utils/token.js";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleLogin = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: "Google token missing" });
    }

    // 🔐 Verify Google Token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload) {
      return res.status(401).json({ message: "Invalid Google token" });
    }

    const {
      sub: google_id,
      email,
      name,
      picture,
      email_verified,
    } = payload;

    if (!email) {
      return res.status(400).json({ message: "Email not found" });
    }

    // 🔎 Check user in DB
    let userResult = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    let user = userResult.rows[0];

    // 🆕 Create user if not exists
    if (!user) {
      const newUser = await pool.query(
        `INSERT INTO users 
        (google_id, name, email, profile_pic, email_verified, auth_provider)
        VALUES ($1,$2,$3,$4,$5,$6)
        RETURNING *`,
        [
          google_id,
          name,
          email,
          picture,
          email_verified,
          "google",
        ]
      );

      user = newUser.rows[0];
    }

    // 🔑 Generate JWT (your app login token)
    const jwtToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
      },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" }
    );

    return res.json({
      message: "Login success",
      token: jwtToken,
      user,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

// REGISTER USER
export const registerUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required",
      });
    }

    const existingUser = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `
      INSERT INTO users (
        name,
        email,
        password,
        auth_provider,
        email_verified
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING 
        id,
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
      [name, email, hashedPassword, "email", false]
    );

    const user = result.rows[0];
    const token = createToken(user.id, user.email);

    return res.status(201).json({
      message: "Account created successfully",
      token,
      user,
    });
  } catch (error) {
    console.log("Register Error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// LOGIN USER
export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );
    

    if (result.rows.length === 0) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const user = result.rows[0];

    if (!user.password) {
      return res.status(401).json({
        message: "Please login with your original login method",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const token = createToken(user.id, user.email);

    delete user.password;

    return res.status(200).json({
      message: "Login successful",
      token,
      user,
    });
  } catch (error) {
    console.log("Login Error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};