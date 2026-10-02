import {
  add_user_refresh_tokens,
  get_refresh_token_by_id,
  revoke_all_refresh_tokens,
  rotate_refresh_token,
} from "@/repositories/refresh_token";
import { Refresh_Token, RefreshTokenPayload } from "@/types";
import { RequestHandler } from "express";
import bcrypt from "bcrypt";
import { gen_token, hash_secret, verify_token } from "@/utils";

export const create_or_update_refresh_token: RequestHandler = async (
  req,
  res,
) => {
  const { body } = req as Refresh_Token;
  const { refresh_token } = body;

  const is_valid_token = verify_token<RefreshTokenPayload>(
    refresh_token,
    "refresh",
  );

  if (!is_valid_token.valid) {
    return res.status(401).json({
      msg: "User token invalid/expired",
    });
  }

  const { payload } = is_valid_token;

  const is_token_exist = await get_refresh_token_by_id(payload.id);

  if (is_token_exist.rowCount === 0) {
    return res.status(401).json({
      msg: "User token invalid/expired",
    });
  }

  const { revoked_at, id, token_hash, user_id } = is_token_exist.rows[0];

  const compare = await bcrypt.compare(refresh_token, token_hash);

  if (!compare) {
    return res.status(401).json({
      msg: "User token invalid/expired",
    });
  }

  if (revoked_at) {
    await revoke_all_refresh_tokens(user_id);
    return res.status(401).json({
      msg: "Stolen tokens observed and revoked.",
    });
  }

  const new_token_id = crypto.randomUUID();
  const new_access_token = gen_token(
    { id: crypto.randomUUID(), email: payload.email, type: "access" },
    "access",
  );
  const new_refresh_token = gen_token(
    { id: new_token_id, email: payload.email, type: "refresh" },
    "refresh",
  );
  const new_token_hash = await hash_secret(new_refresh_token);

  await add_user_refresh_tokens({
    id: new_token_id,
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
    token_hash: new_token_hash,
    user_id,
    ip: req.ip,
  });

  await rotate_refresh_token(id, new_token_id);

  return res.json({
    refresh_token: new_refresh_token,
    access_token: new_access_token,
  });
};
