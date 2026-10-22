import {
  create_category,
  delete_category,
  read_all_categories,
  read_category,
  read_category_by_id,
  update_category,
} from "@/repositories/categories";
import {
  Create_CategoryT,
  Delete_CategoryT,
  Read_Category_By_IDT,
  Read_CategoryT,
  Update_CategoryT,
} from "@/types/categories";
import { RequestHandler } from "express";

export const get_all_categories: RequestHandler = async (req, res, next) => {
  const query = await read_all_categories(req.user.id);

  return res.json(query);
};

export const get_category_by_id: RequestHandler<
  Read_Category_By_IDT["params"]
> = async (req, res, next) => {
  const { params } = req;
  const { id } = params;

  const result = await read_category_by_id(id, req.user.id);

  if (result.rowCount === 0) {
    return res.status(404).json({
      message: "Category your looking for not available",
    });
  }
  return res.json(result);
};

export const get_category_by_slug: RequestHandler<
  Read_CategoryT["params"]
> = async (req, res, next) => {
  const { params } = req;
  const { name } = params;

  const result = await read_category(name);

  if (result.rowCount === 0) {
    return res.status(404).json({
      message: "Category your looking for not available",
    });
  }
  return res.json(result);
};

export const add_category: RequestHandler<
  {},
  {},
  Create_CategoryT["body"]
> = async (req, res) => {
  const { body } = req;

  const result = await create_category(body, req.user.id);

  return res.json({
    message: "Category inserted successfully",
    data: result.rows[0],
  });
};

export const modify_category: RequestHandler<
  Update_CategoryT["params"],
  {},
  Update_CategoryT["body"]
> = async (req, res) => {
  const { params } = req;
  const { body } = req;

  const is_category_exist = await read_category_by_id(params.id, req.user.id);

  if (Object.keys(body).length === 0) {
    return res.status(400).json({
      message: "At least a field required to update the data",
    });
  }

  if (is_category_exist.rowCount === 0) {
    return res.status(404).json({
      message: "Category your looking for not available",
    });
  }

  const result = await update_category(body, req.user.id, params.id);

  return res.json({
    message: "Category updated",
    data: result.rows[0],
  });
};

export const remove_category: RequestHandler<
  Delete_CategoryT["params"]
> = async (req, res) => {
  const { params } = req;
  const { id } = params;

  const is_category_exist = await delete_category(id, req.user.id);

  if (is_category_exist.rowCount === 0) {
    return res.status(404).json({
      message: "Category your looking for not available",
    });
  }

  return res.json({
    message: "Category deleted successfully",
  });
};
