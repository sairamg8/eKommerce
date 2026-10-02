import { refresh_schema } from "@/schema/refresh";
import { refresh_token_schema } from "@/schema/user";
import z from "zod";

export interface RepoReturn<T> {
  rowCount: number;
  rows: T[];
}

export type Refresh = z.infer<typeof refresh_schema>;
export type Refresh_Token = z.infer<typeof refresh_token_schema>;

interface ValidToken<T> {
  valid: true;
  payload: T;
}

interface InValidToken<T> {
  valid: false;
  error: string;
}

export type Verification_Token<T> = ValidToken<T> | InValidToken<T>;

export interface RefreshTokenPayload {
  id: string;
  email: string;
  type: "refresh";
  iat: number;
  exp: number;
}

export interface AccessTokenPayload {
  id: string;
  email: string;
  type: "access";
  iat: number;
  exp: number;
}
