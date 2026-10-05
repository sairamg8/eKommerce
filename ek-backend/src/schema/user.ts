import z from "zod";

export const create_user = z.object({
  body: z.object({
    first_name: z.string({ error: "User first cannot be empty" }).min(3, {
      error: "At least 3 letters required",
    }),

    last_name: z.string({ error: "Last name cannot be empty" }).min(3, {
      error: "At least 3 letters required",
    }),

    email: z.email({ error: "Valid email address required" }),

    password: z
      .string({ error: "Password cannot be empty" })
      .min(6, { error: "Least 6 characters required" }),

    preferences: z.record(z.string(), z.string()).optional(),
  }),
});

export const login_user = z.object({
  body: z.object({
    email: z.string({ error: "Email cannot be empty" }),
    password: z.string({ error: "Password cannot be empty" }),
  }),
});

export const refresh_token_schema = z.object({
  body: z.object({
    refresh_token: z.string({
      error: "Refresh token cannot be undefined",
    }),
  }),
});

export const forgot_password_schema = z.object({
  body: z.object({
    email: z.string({
      error: "Email cannot be empty",
    }),
  }),
});

export const forgot_password = z.object({
  id: z.string({
    error: "ID Must be required",
  }),
  user_id: z.string({
    error: "User id must be required",
  }),
  token_hash: z.string({
    error: "Token hash must be required",
  }),
  expiry_time: z.iso.datetime({
    error: "Expiry time must be required",
  }),
  created_at: z.iso.datetime().optional(),
});

export const password_reset = z.object({
  query: z.object({
    token: z.string({ error: "Token string must be required" }),
  }),
  body: z.object({
    password: z
      .string({ error: "Password required" })
      .min(6, { error: "At least 6 characters of password required" }),
  }),
});
