import { User, UserRes } from "@/types/user";
import { query } from "@/utils";

type NewUser = Omit<UserRes, "id" | "created_at" | "deleted_at" | "updated_at">;

const allowed_columns = new Set<keyof NewUser>([
  "email",
  "first_name",
  "last_name",
  "password_hash",
  "preferences",
]);

const create_user = async (data: Partial<UserRes>) => {
  const valid_entries = Object.entries(data).filter(
    ([key, value]) =>
      allowed_columns.has(key as keyof NewUser) && value !== undefined,
  );

  const columns = valid_entries.map(([key]) => `"${key}"`).join(", ");
  const placeholders = valid_entries
    .map((_, index) => `$${index + 1}`)
    .join(", ");
  const values = valid_entries.map(([key, value]) => {
    return key === "preferences" && typeof value === "object"
      ? JSON.stringify(value)
      : value;
  });

  const sql = await query<UserRes>(
    `insert into app.users (${columns})
  values (${placeholders})
  returning *`,
    values,
  );

  return sql;
};

const get_user = async (email: string) => {
  const q = await query<UserRes>(
    `select * from app.users where lower(email) = lower($1)`,
    [email],
  );

  return q;
};

const update_user = async (data: Partial<UserRes>, id: string) => {
  const valid_entries = Object.entries(data).filter(
    ([key, value]) =>
      allowed_columns.has(key as keyof NewUser) && value !== undefined,
  );

  const values = valid_entries.map(([_, value]) => value);

  const placeholder = valid_entries
    .map(([key], i) => `${key}=$${i + 1}`)
    .join(", ");

  const sql = await query(
    `update app.users set ${placeholder}
    where id = $${valid_entries.length + 1}
    returning id, email, first_name, last_name, preferences`,
    [...values, id],
  );

  return sql;
};

export { create_user, get_user, update_user };
