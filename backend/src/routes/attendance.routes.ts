import express from "express";
import { authorize } from "../middleware/auth.middleware.js";

import {
  checkIn,
  checkOut,
  getTodayAttendance,
  getMonthlyAttendance,
  getMonthlyStats,
} from "../controllers/attendance.controller.js";

const router = express.Router();

router.get("/today", authorize, getTodayAttendance);

router.post("/check-in", authorize, checkIn);

router.put("/check-out", authorize, checkOut);

router.get("/month", authorize, getMonthlyAttendance);

router.get("/stats", authorize, getMonthlyStats);



export default router;