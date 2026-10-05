import { ForgotPasswordRes } from "@/types/user";
import { query } from "@/utils";

export const get_reset_token_by_id = async (id: string) => {
  const result = await query<ForgotPasswordRes>(
    `select * from app.reset_password where id = $1`,
    [id],
  );

  return result;
};
export const get_reset_token_by_user_id = async (id: string) => {
  const result = await query<ForgotPasswordRes>(
    `select * from app.reset_password where user_id = $1`,
    [id],
  );

  return result;
};

export const get_reset_token = async (token_hash: string) => {
  const result = await query<ForgotPasswordRes>(
    `select * from app.reset_password where token_hash = $1`,
    [token_hash],
  );

  return result;
};

export const create_reset_token = async (
  data: Omit<ForgotPasswordRes, "created_at">,
) => {
  const { expiry_time, id, token_hash, user_id } = data;
  const result = await query<ForgotPasswordRes>(
    `insert into app.reset_password (
        id, user_id, token_hash, expiry_time, created_at
        )
        values ($1, $2, $3, $4, now())
        returning *
        `,
    [id, user_id, token_hash, expiry_time],
  );

  return result;
};

export const destroy_reset_password_token = async (id: string) => {
  const result = await query(
    `
    delete from app.reset_password where id = $1
    `,
    [id],
  );

  return result;
};
