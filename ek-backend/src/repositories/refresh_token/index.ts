import { Refresh } from "@/types";
import { construct_query_values, query } from "@/utils";

export const get_user_refresh_tokens = async (user_id: string) => {
  const result = await query(
    `select * from app.refresh_tokens
      where user_id = $1 and revoked_at is null`,
    [user_id],
  );

  return result;
};

export const add_user_refresh_tokens = async (params: Refresh) => {
  const { keys, placeholders, values } = construct_query_values(params);
  const q = await query(
    `insert into app.refresh_tokens ( ${keys.join(", ")} )
    values(${placeholders.join(", ")})
    returning *
    `,
    values,
  );

  return q;
};

export const get_refresh_token_by_id = async (id: string) => {
  const q = await query<Refresh>(
    `
    select * from app.refresh_tokens where id = $1
    `,
    [id],
  );

  return q;
};

export const revoke_all_refresh_tokens = async (user_id: string) => {
  const q = await query(
    `
    update app.refresh_tokens set revoked_at = now()
    where user_id = $1 and revoked_at is null
    `,
    [user_id],
  );

  return q;
};

export const revoke_token = async (id: string) => {
  const q = await query(
    `
    update app.refresh_tokens set revoked_at = now() where id = $1 and revoked_at is null
    `,
    [id],
  );

  return q;
};

/**
 * - Verify the old token is existed or not
 * - Check either the old is expired or not
 * - Check either old token is being reused
 * - Update the token
 * - Insert new token
 */

export const rotate_refresh_token = async (
  old_token_id: string,
  new_token_id: string,
) => {
  const q = await query(
    `
    update app.refresh_tokens set revoked_at = now(), replaced_by_id = $1 where id = $2
    `,
    [new_token_id, old_token_id],
  );

  return q;
};
