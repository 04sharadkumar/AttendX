// routes/auth.routes.ts

import express from "express";
import { googleLogin } from "../controllers/auth.controller.js";
import {registerUser,loginUser} from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/google", googleLogin);
router.post("/login", loginUser);
router.post("/register", registerUser);

export default router;