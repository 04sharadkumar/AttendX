import express from "express";
import {
  getAdminDashboard,
  getPendingAttendance,
  approveAttendance,
  rejectAttendance,
  getAllEmployees,
  getMonthlyReport,
} from "../controllers/admin.controller.js";
import { authorize } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/dashboard",authorize,getAdminDashboard);

router.get("/attendance/pending", authorize,  getPendingAttendance);

router.put("/attendance/approve/:attendance_id", authorize,  approveAttendance);

router.put("/attendance/reject/:attendance_id", authorize,  rejectAttendance);

router.get("/employees", authorize,  getAllEmployees);

router.get("/reports/monthly", authorize,  getMonthlyReport);

// router.put("/approve/:attendance_id", authorize, approveAttendance);

// router.put("/reject/:attendance_id", authorize, rejectAttendance);

export default router;