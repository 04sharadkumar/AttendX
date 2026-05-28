import express from "express";
import {
  getUserProfile,
  updateUserProfile
} from "../controllers/user.controller.js";
import { authorize } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/profile", authorize, getUserProfile);
router.put("/profile", authorize, updateUserProfile);


export default router;