import z from "zod";

export const signup = z
  .object({
    first_name: z
      .string()
      .trim()
      .min(1, { error: "First name cannot be empty" }),
    last_name: z.string().trim().min(1, { error: "Last name cannot be empty" }),
    email: z.email({ error: "Email cannot be empty" }),
    password: z
      .string()
      .trim()
      .min(6, { error: "Password must be at least 6 characters" }),
    preferences: z.record(z.string(), z.any()).optional(),
    confirm_password: z
      .string()
      .trim()
      .min(6, { error: "Password must be at least 6 characters" }),
  })
  .refine((data) => data.password === data.confirm_password, {
    error: "Password and Confirm password do not match",
    path: ["confirm_password"],
  });
