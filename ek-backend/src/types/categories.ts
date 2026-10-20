import {
  create_category,
  delete_category,
  read_category,
  read_category_by_id,
  update_category,
} from "@/schema/category";
import z from "zod";

export type CategoryT = z.infer<typeof create_category>;

export type Update_CategoryT = z.infer<typeof update_category>;

export type Delete_CategoryT = z.infer<typeof delete_category>;

export type Read_Category_By_IDT = z.infer<typeof read_category_by_id>;
export type Read_CategoryT = z.infer<typeof read_category>;

export type Update_Category_ResT = Update_CategoryT["body"]