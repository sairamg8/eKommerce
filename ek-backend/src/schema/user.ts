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
