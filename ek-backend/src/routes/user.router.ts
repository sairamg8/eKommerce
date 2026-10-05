import {
  ForgotPassword,
  Login,
  Logout,
  ResetPassword,
  Signup,
} from "@/controller/auth";
import { create_or_update_refresh_token } from "@/controller/refresh_token";
import { Profile } from "@/controller/user/profile";
import { auth_middleware } from "@/middlewares/auth_middleware";
import { req_validate } from "@/middlewares/req_validate";
import {
  create_user,
  forgot_password_schema,
  login_user,
  password_reset,
  refresh_token_schema,
} from "@/schema/user";
import e from "express";

const user_router = e.Router();

user_router.post("/signup", req_validate(create_user), Signup);
user_router.post("/login", req_validate(login_user), Login);
user_router.post(
  "/refresh_token",
  req_validate(refresh_token_schema),
  create_or_update_refresh_token,
);
user_router.get("/profile", auth_middleware, Profile);
user_router.post("/logout", req_validate(refresh_token_schema), Logout);
user_router.post(
  "/forgot-password",
  req_validate(forgot_password_schema),
  ForgotPassword,
);

user_router.post(
  "/reset-password",
  req_validate(password_reset),
  ResetPassword,
);

export default user_router;
