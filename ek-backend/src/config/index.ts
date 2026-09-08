import { Pool } from "pg";
import "dotenv/config";

export const pool = new Pool({
  host: process.env.host,
  port: Number(process.env.port) || 5432,
  database: process.env.database,
  password: process.env.password,
  max: 20,
});
