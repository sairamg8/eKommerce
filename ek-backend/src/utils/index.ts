import { pool } from "@/config";
import { env } from "@/config/env";
import { RepoReturn, Verification_Token } from "@/types";
import bcrypt from "bcrypt";
import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";
import { createHash, hash } from "node:crypto";

type SecretType = "access" | "refresh";

interface Data {
  keys: unknown[];
  values: unknown[];
  placeholders: unknown[];
}

export const query = async <T>(
  sql: string,
  values: unknown[],
): Promise<RepoReturn<T>> => {
  const result = await pool.query(sql, values);

  return {
    rowCount: result.rowCount || 0,
    rows: result.rows,
  };
};

export const hash_secret = async (secret: string) => {
  return await bcrypt.hash(secret, 12);
};

export const decrypt_hash = async (secret: string, text: string) => {
  return await bcrypt.compare(text, secret);
};

export const gen_token = (payload: unknown, secret_type: SecretType) => {
  const secret = {
    access: {
      secret: env.access_secret,
      expiresIn: "15min",
    },
    refresh: {
      secret: env.refresh_secret,
      expiresIn: "24hrs",
    },
  };

  return jwt.sign(payload as JwtPayload, secret[secret_type].secret, {
    expiresIn: secret[secret_type].expiresIn as SignOptions["expiresIn"],
  });
};

export const construct_query_values = (
  data: Record<string, unknown>,
  create = true,
): Data => {
  const keys = [];
  const values = [];
  const placeholders = [];

  for (const key in data) {
    if (data[key] !== undefined) {
      keys.push(key);
      const count = values.length + 1;
      placeholders.push(create ? `$${count}` : `$${key} = $${count}`);
      values.push(data[key]);
    }
  }

  return {
    keys,
    values,
    placeholders,
  };
};

export const verify_token = <T>(
  token: string,
  secret_type: SecretType,
): Verification_Token<T> => {
  try {
    const secret =
      secret_type === "access" ? env.access_secret : env.refresh_secret;
    const decode = jwt.verify(token, secret) as T;

    return {
      valid: true,
      payload: decode,
    };
  } catch (err: unknown) {
    const error = err as Error;

    return {
      valid: false,
      error: error.message,
    };
  }
};

export const hash_token = (text: string) =>
  createHash("sha256").update(text).digest("hex");

export const verify_hash = (text: string) => {
  const hash = createHash("sha256");
  hash.update(text);

  const digest = hash.digest("hex");

  return digest;
};
