import { get_user } from "@/repositories/user/user.repo";
import { RequestHandler } from "express";

export const Profile: RequestHandler = async (req, res, next) => {
  const { email } = req.user;

  const { rowCount, rows } = await get_user(email);

  if (!rowCount) {
    return res.status(401).json({
      msg: "invalid request",
    });
  }

  const { password_hash, deleted_at, ...rest } = rows[0];

  return res.status(200).json({
    user_info: rest,
  });
};
