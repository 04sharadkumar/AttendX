import express from "express";
import {
  getUserProfile,
  getUserByEmail,
  updateUserProfile,
} from "../controllers/user.controller";

const router = express.Router();

router.get("/profile", getUserProfile);
router.get("/:email", getUserByEmail);
router.put("/:email", updateUserProfile);

export default router;