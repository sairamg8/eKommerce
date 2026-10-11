import z from "zod";
import type { signup } from "../routes/auth/Schema";

export interface UserRes {
  user: {
    first_name: string;
    last_name: string;
    email: string;
    preferences: Record<string, unknown>;
    created_at: string;
    updated_at: string | null;
  };
  access_token: string;
  refresh_token: string;
}

export interface Login {
  email: string;
  password: string;
}

export type SignupT = z.infer<typeof signup>;

export const reset_password_schema = z
  .object({
    password: z.string({ error: "Password must be required" }),
    confirm_password: z.string({ error: "Confirm password must be required" }),
  })
  .refine(
    (data) =>
      data.password === data.confirm_password &&
      "Password and confirm password must be same",
  );

export type ResetPasswordT = z.infer<typeof reset_password_schema>;

export type ResetPassword_argsT = {
  password: string;
  token: string;
};

export interface Reset_Password_Res {
  message: string;
}
