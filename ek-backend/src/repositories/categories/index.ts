import { category } from "@/config/allowed_keys";
import {
  CategoryT,
  Read_CategoryT,
  Update_Category_ResT,
  Update_CategoryT,
} from "@/types/categories";
import { construct_query_values, query } from "@/utils";

/**
 *
 * Create
 * Read
 *  -> Sorting
 *  -> filtering
 * Update
 * Delete
 */

export const create_category = async (data: Update_Category_ResT) => {
  const { keys, placeholders, values } = construct_query_values(
    data,
    true,
    category,
  );

  const res = await query(
    `insert into app.categories (${keys.join(", ")}, user_id) values(${placeholders.join(", ")}, $${placeholders.length + 1}) returning *`,
    [...values, data.id],
  );

  return res;
};

export const update_category = async (data: Update_CategoryT["body"]) => {
  const { placeholders, values } = construct_query_values(
    data,
    false,
    category,
  );

  const res = await query(
    `update app.categories set ${placeholders}
        where id = $${values.length + 1}
        returning *`,
    [...values, data.id],
  );

  return res;
};

export const read_category = async (name: string) => {
  const result = await query(
    `select * from app.categories where lower(name) = lower($1) and deleted_at is null`,
    [name],
  );
  return result;
};

export const read_category_by_id = async (id: string) => {
  const result = await query(
    `select * from app.categories where id = $1 and deleted_at is null`,
    [id],
  );
  return result;
};

export const delete_category = async (id: string) => {
  const result = await query(
    `update app.categories set deleted_at = now() where id = $1 and deleted_at is null returning id`,
    [id],
  );

  if (result.rows.length === 0) {
    throw new Error("Category not found");
  }
  return result;
};

export const read_all_categories = async (user_id: string) => {
  const result = await query(
    "select * from app.categories where user_id = $1 and deleted_at is null",
    [user_id],
  );
  return result;
};
