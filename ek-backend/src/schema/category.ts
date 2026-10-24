import z from "zod";

export const base_category_schema = z.object({
  name: z.string({ error: "Category name cannot be empty" }),
  slug: z.string({ error: "Category slug cannot be empty" }),
  display_order: z
    .string({ error: "Display order cannot be empty" })
    .or(z.number({ error: "Display order cannot be empty" })),
  images: z.array(z.url({ error: "Category images should array of URL" })),
  description: z.string({ error: "Category description cannot be empty" }),
  is_active: z.coerce.boolean().optional().default(true),
  specifications: z
    .record(z.string(), z.string(), {
      error: "Specification must key and value pairs",
    })
    .optional(),
});

export const category_response_schema = base_category_schema.extend({
  id: z.string({ error: "Category id must be required" }),
  created_at: z.string({ error: "Created at must be required" }),
  updated_at: z.string({ error: "Updated at must be required" }),
});

export const create_category = z.object({
  body: base_category_schema,
});

export const update_category = z.object({
  body: base_category_schema.partial(),
  params: z.object({
    id: z.string({ error: "Category ID must required" }),
  }),
});

export const delete_category = z.object({
  params: z.object({
    id: z.string({ error: "Category ID must be required" }),
  }),
});

export const read_category_by_id = z.object({
  params: z.object({
    id: z.string({ error: "Category ID parameter required" }),
  }),
});

export const read_category = z.object({
  params: z.object({
    name: z.string({ error: "Category name parameter required" }),
  }),
});
