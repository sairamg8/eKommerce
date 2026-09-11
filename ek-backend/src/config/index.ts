import { Pool } from "pg";
import { env } from "./env";

export const pool = new Pool({
  host: env.db_host,
  port: env.db_port || 5432,
  user: env.db_user,
  database: env.db_name,
  password: env.db_password,
});

pool.connect((err, client, release) => {
  if (err) {
    return console.error(`Error acquiring client`, client);
  }

  console.log("Database connection successful");
  release();
});
