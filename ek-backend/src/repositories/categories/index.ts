import { category } from "@/config/allowed_keys";
import {
  Category_ResT,
  Create_CategoryT,
  Read_CategoryT,
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

export const create_category = async (
  data: Create_CategoryT["body"],
  user_id: string,
) => {
  const { keys, placeholders, values } = construct_query_values(
    data,
    true,
    category,
  );

  const res = await query(
    `insert into app.categories (${keys.join(", ")}, user_id) values(${placeholders.join(", ")}, $${placeholders.length + 1}) returning *`,
    [...values, user_id],
  );

  return res;
};

export const update_category = async (
  data: Update_CategoryT["body"],
  user_id: string,
  id: string,
) => {
  const { placeholders, values } = construct_query_values(
    data,
    false,
    category,
  );

  const res = await query(
    `update app.categories set ${placeholders}, updated_at = now()
        where id = $${values.length + 1} and user_id = $${values.length + 2} and deleted_at is null
        returning *`,
    [...values, id, user_id],
  );

  return res;
};

export const read_category = async (slug: string) => {
  const result = await query(
    `select * from app.categories where lower(slug) = lower($1) and deleted_at is null`,
    [slug],
  );
  return result;
};

export const read_category_by_id = async (id: string, user_id: string) => {
  const result = await query(
    `select * from app.categories where id = $1 and user_id = $2 and deleted_at is null`,
    [id, user_id],
  );
  return result;
};

export const delete_category = async (id: string, user_id: string) => {
  const result = await query(
    `update app.categories set deleted_at = now() where id = $1 and user_id = $2 and deleted_at is null returning id`,
    [id, user_id],
  );
  return result;
};

export const read_all_categories = async (user_id: string) => {
  const result = await query(
    "select * from app.categories where user_id = $1 and deleted_at is null",
    [user_id],
  );
  return result;
};
