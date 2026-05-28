import { Pool } from "pg";
import dns from "dns";
import dotenv from "dotenv";

dotenv.config();

// ⭐ FORCE IPv4 globally BEFORE DB connects
dns.setDefaultResultOrder("ipv4first");

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});