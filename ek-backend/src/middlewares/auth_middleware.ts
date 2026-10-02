import { get_user } from "@/repositories/user/user.repo";
import { AccessTokenPayload } from "@/types";
import { verify_token } from "@/utils";
import { RequestHandler } from "express";

declare global {
  namespace Express {
    interface Request {
      user: {
        id: string;
        email: string;
      };
    }
  }
}

export const auth_middleware: RequestHandler = async (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      msg: "You do not have authorization.",
    });
  }

  const is_valid_token = verify_token<AccessTokenPayload>(token, "access");

  if (!is_valid_token.valid) {
    return res.status(401).json({
      msg: "Invalid/Expired token, Please login to continue",
    });
  }

  const { rowCount, rows } = await get_user(is_valid_token.payload.email);

  if (rowCount === 0) {
    return res.status(401).json({
      msg: "InValid email/password",
    });
  }

  const { id, email } = rows[0];

  req.user = {
    id,
    email,
  };

  next();
};
