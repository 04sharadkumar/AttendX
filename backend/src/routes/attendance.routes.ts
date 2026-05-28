import express from "express";
import {
  checkIn,
  checkOut,
  getTodayAttendance,
  getUserAttendance,
  getMonthlyAttendance,
  approveAttendance,
  getMonthlyStats,
} from "../controllers/attendance.controller";

const router = express.Router();

router.post("/check-in", checkIn);

router.put("/check-out", checkOut);

router.get("/today/:user_id", getTodayAttendance);

router.get("/user/:user_id", getUserAttendance);

router.get("/month/:user_id", getMonthlyAttendance);

router.put("/approve/:attendance_id", approveAttendance);

router.get("/stats/:user_id", getMonthlyStats);

export default router;