import type z from "zod";
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
