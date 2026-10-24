import {
  add_category,
  get_all_categories,
  get_category_by_slug,
  get_category_by_id,
  modify_category,
  remove_category,
} from "@/controller/category";
import { auth_middleware } from "@/middlewares/auth_middleware";
import { req_validate } from "@/middlewares/req_validate";
import {
  create_category,
  delete_category,
  read_category,
  read_category_by_id,
  update_category,
} from "@/schema/category";
import e from "express";

const category = e.Router();

category.get("/", auth_middleware, get_all_categories);
category.get(
  "/:id",
  auth_middleware,
  req_validate(read_category_by_id),
  get_category_by_id,
);
category.get(
  "/slug/:name",
  auth_middleware,
  req_validate(read_category),
  get_category_by_slug,
);
category.post(
  "/",
  auth_middleware,
  req_validate(create_category),
  add_category,
);
category.patch(
  "/:id",
  auth_middleware,
  req_validate(update_category),
  modify_category,
);
category.delete(
  "/:id",
  auth_middleware,
  req_validate(delete_category),
  remove_category,
);

export default category;
