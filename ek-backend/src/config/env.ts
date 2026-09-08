import { z } from "zod";

const env_schema = z.object({
  node_env: z.enum(["development", "production"]),
  db_port: z.coerce.number().int().positive().default(5432),
  app_port: z.coerce.number().int().positive().default,

  db_host: z.string({ error: "Database name required" }),
  db_connection_string: z.string({
    error: "Database connection string required incase of no host",
  }),
});
