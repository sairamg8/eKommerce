import { randomUUID } from "node:crypto";
import {
  add_user_refresh_tokens,
  get_refresh_token_by_id,
  revoke_all_refresh_tokens,
  revoke_token,
} from "@/repositories/refresh_token";
import {
  create_user,
  get_user,
  update_user,
} from "@/repositories/user/user.repo";
import {
  Forgot_Password,
  Login_user,
  Password_Reset,
  User,
} from "@/types/user";
import {
  decrypt_hash,
  gen_token,
  hash_secret,
  hash_token,
  verify_hash,
  verify_token,
} from "@/utils";
import { RequestHandler } from "express";
import { Refresh_Token, RefreshTokenPayload } from "@/types";
import {
  create_reset_token,
  destroy_reset_password_token,
  get_reset_token,
  get_reset_token_by_user_id,
} from "@/repositories/reset_password";
import trigger_email from "@/utils/send_email";
import { password_reset } from "@/templates/password_reset";

export const Signup: RequestHandler = async (req, res, next) => {
  const { body } = req as {
    body: User;
  };

  const password = await hash_secret(body.password);

  const data = {
    first_name: body.first_name,
    last_name: body.last_name,
    email: body.email,
    password_hash: password,
    preferences: body.preferences || {},
  };

  const { rows } = await create_user(data);
  const { password_hash, deleted_at, ...rest } = rows[0];

  return res.json({
    msg: "OK",
    data: rest,
  });
};

export const Login: RequestHandler = async (req, res) => {
  const { body } = req as {
    body: Login_user;
  };

  const { email, password } = body;

  const { rowCount, rows } = await get_user(email);

  if (!rowCount) {
    return res.status(401).json({
      msg: "User email/password is incorrect",
    });
  }

  const user = rows[0];
  const { deleted_at, password_hash, id, ...rest } = user;

  if (deleted_at) {
    return res.status(401).json({ msg: "Account not found or deactivated" });
  }

  const is_valid_password = await decrypt_hash(password_hash, password);

  if (!is_valid_password) {
    return res.status(401).json({
      msg: "User email/password is incorrect",
    });
  }

  const payload = {
    id: randomUUID(),
    email,
    type: "access",
  };

  const refresh_payload = {
    id: randomUUID(),
    email,
    type: "refresh",
  };

  const access_token = gen_token(payload, "access");
  const refresh_token = gen_token(refresh_payload, "refresh");

  const hash_refresh_token = await hash_secret(refresh_token);

  await add_user_refresh_tokens({
    id: refresh_payload.id,
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
    user_id: id,
    ip: req.ip,
    token_hash: hash_refresh_token,
  });

  res.json({
    user: rest,
    access_token,
    refresh_token,
  });
};

export const Logout: RequestHandler = async (req, res, next) => {
  const { body } = req as Refresh_Token;

  const { refresh_token } = body;

  const decode = verify_token<RefreshTokenPayload>(refresh_token, "refresh");

  if (!decode.valid) {
    return res.status(401).json({
      msg: "Invalid/Expired token",
    });
  }

  const { id } = decode.payload;

  const { rowCount, rows } = await get_refresh_token_by_id(id);

  if (!rowCount) {
    return res.status(401).json({
      msg: "Invalid/Expired token",
    });
  }

  const token_info = rows[0];

  const check_hash = await decrypt_hash(token_info.token_hash, refresh_token);

  if (!check_hash) {
    return res.status(401).json({
      msg: "InValid/Expired token",
    });
  }

  if (token_info.revoked_at) {
    return res.status(401).json({
      msg: "Token reuse detected",
    });
  }

  await revoke_token(id);

  return res.status(200).json({
    msg: "User logged out successfully",
  });
};

/**
 * When user clicked on forgot password i need to verify email
 * Once user email verification complete need to check any available reset token with
 * If any i need to invalidate them or delete them
 * need to create a fresh reset token
 * before accepting user password i need to confirm that used_at is existed and matching user_id
 * if so i need to reset user passwords
 */

export const ForgotPassword: RequestHandler = async (req, res) => {
  const { body } = req;
  const { email } = body as Forgot_Password;

  const { rowCount, rows } = await get_user(email);

  if (rowCount === 0) {
    return res.status(200).json({
      msg: "A reset password link will be shared if user email exists.",
    });
  }

  const { id } = rows[0];

  const { rowCount: user_refresh_count, rows: user_refresh_tokens } =
    await get_reset_token_by_user_id(id);

  if (user_refresh_count > 0) {
    for (const invalid of user_refresh_tokens) {
      await destroy_reset_password_token(invalid.id);
    }
  }

  const token_id = crypto.randomUUID();

  const part_1_token = crypto.randomUUID();
  const part_2_token = crypto.randomUUID();

  const token_hash = hash_token(`${part_1_token}_${part_2_token}`);

  await create_reset_token({
    expiry_time: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    id: token_id,
    token_hash,
    user_id: id,
  });

  await trigger_email({
    body: password_reset({
      link: `http://localhost:5173/user/password-reset?token=${part_1_token}_${part_2_token}`,
    }),
    email: email,
    subject: "eKommerce: Password reset ",
  });

  return res.json({
    msg: "A reset password link will be shared if user email exists.",
    reset_token: `${part_1_token}_${part_2_token}`,
  });
};

export const ResetPassword: RequestHandler = async (req, res) => {
  const { query, body } = req;

  const { password } = body as Password_Reset["body"];
  const { token } = query as Password_Reset["query"];

  if (!token) {
    return res.status(400).json({
      msg: "Invalid link.",
    });
  }

  const hashed_token = hash_token(token);

  const { rowCount, rows } = await get_reset_token(hashed_token);

  if (!rowCount) {
    return res.status(400).json({
      msg: "InValid link",
    });
  }

  const { id, user_id, expiry_time } = rows[0];

  if (new Date(expiry_time) < new Date()) {
    return res.status(400).json({
      msg: "InValid link",
    });
  }

  const password_hash = await hash_secret(password);

  await update_user({ password_hash }, user_id);
  await destroy_reset_password_token(id);

  await revoke_all_refresh_tokens(user_id);

  return res.json({
    msg: "Password updated successfully",
  });
};
