import { create_user, login_user } from "@/schema/user";
import z from "zod";

export interface UserRes {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  password_hash: string;
  preferences: Record<string, string | number | boolean>;
  created_at: string;
  updated_at: string;
  deleted_at: string;
}

export type User = z.infer<typeof create_user>["body"];
export type Login_user = z.infer<typeof login_user>["body"];
