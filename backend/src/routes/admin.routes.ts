import express from "express";
import { authorize } from "../middleware/auth.middleware.js";

import {
  approveAttendance,
  rejectAttendance,
} from "../controllers/attendance.controller.js";
import { getAdminDashboard } from "../controllers/admin.controller.js";

const router = express.Router();

router.get("/dashboard",authorize,getAdminDashboard);

router.put("/approve/:attendance_id", authorize, approveAttendance);

router.put("/reject/:attendance_id", authorize, rejectAttendance);

export default router;