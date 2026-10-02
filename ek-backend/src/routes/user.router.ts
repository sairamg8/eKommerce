import { Login, Logout, Signup } from "@/controller/auth";
import { create_or_update_refresh_token } from "@/controller/refresh_token";
import { req_validate } from "@/middlewares/req_validate";
import { create_user, login_user, refresh_token_schema } from "@/schema/user";
import e from "express";

const user_router = e.Router();

user_router.post("/signup", req_validate(create_user), Signup);
user_router.post("/login", req_validate(login_user), Login);
user_router.post(
  "/refresh_token",
  req_validate(refresh_token_schema),
  create_or_update_refresh_token,
);
user_router.post("/logout", req_validate(refresh_token_schema), Logout);

export default user_router;
