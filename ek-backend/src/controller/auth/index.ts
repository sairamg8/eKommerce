import { randomUUID } from "node:crypto";
import { add_user_refresh_tokens } from "@/repositories/refresh_token";
import { create_user, get_user } from "@/repositories/user/user.repo";
import { Login_user, User } from "@/types/user";
import { decrypt_hash, gen_token, hash_secret } from "@/utils";
import { RequestHandler } from "express";

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

  const result = await create_user(data);
  res.json({
    msg: "OK",
    data: result.rows,
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
