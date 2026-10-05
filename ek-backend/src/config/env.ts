import { z } from "zod";
import "dotenv/config";

const env_schema = z.object({
  node_env: z.enum(["development", "production"]),
  app_port: z.coerce.number().int().positive().default(3000),
  db_user: z.string({ error: "Database user required" }),
  db_port: z.coerce.number().int().positive().default(5432),
  db_host: z.string({ error: "Database name required" }),
  db_name: z.string({
    error: "Database name must be required",
  }),
  db_password: z.string({
    error: "Password must be required",
  }),

  access_secret: z.string({
    error: "Access token secret required",
  }),

  refresh_secret: z.string({
    error: "Refresh token secret required",
  }),
  reset_secret: z.string({
    error: "Reset token secret required",
  }),

  smtp_host: z.string({ error: "SMTP configuration is required smtp_host" }),
  smtp_port: z.string({ error: "SMTP configuration is required smtp_port" }),
  smtp_user: z.string({ error: "SMTP configuration is required smtp_user" }),
  smtp_password: z.string({
    error: "SMTP configuration is required smtp_password",
  }),
  smtp_from: z.string({ error: "SMTP configuration is required smtp_from" }),
});

const result = z.safeParse(env_schema, process.env);

if (!result.success) {
  console.error(
    result.error.issues.map((issue) => ({
      variable: issue.path.join("."),
      message: issue.message,
    })),
  );

  process.exit(1);
}

export const env = result.data;
