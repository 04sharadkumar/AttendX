import dotenv from "dotenv";
import app from "./app.js";
import { pool } from "./config/db.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

async function startServer(): Promise<void> {
  try {
    await pool.connect();
    console.log("PostgreSQL Database Connected ✅");

    app.listen(PORT, () => {
      console.log(`Server Running on PORT ${PORT}`);
    });

  } catch (err: unknown) {
    console.log(
      "Database Connection Error ❌",
      err instanceof Error ? err.message : err
    );


    process.exit(1);
  }
}

startServer();