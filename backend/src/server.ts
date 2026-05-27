import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { Request, Response } from "express";

import authRoutes from "./routes/auth.routes.js";
import attendanceRoutes from "./routes/attendance.routes.js";
import userRoutes from "./routes/user.routes.js";

import { pool } from "./config/db.js";

dotenv.config();

const app = express();


app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json());


app.get("/", (req: Request, res: Response) => {

  res.status(200).json({
    success: true,
    message: "Server is working ✅",
  });
});


app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/attendance", attendanceRoutes);

const PORT = process.env.PORT || 5000;

pool
  .connect()
  .then(() => {
    console.log("PostgreSQL Database Connected ✅");

    app.listen(PORT, () => {
      console.log(`Server Running on PORT ${PORT}`);
    });
  })
  .catch((err) => {
    console.log("Database Connection Error ❌");
    console.log(err.message);
  });