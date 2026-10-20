import z from "zod";

export const create_category = z.object({
  body: z.object({
    name: z.string({ error: "Category name cannot be empty" }),
    slug: z.string({ error: "Category slug cannot be empty" }),
    display_order: z.string({ error: "Display order cannot be empty" }).or(z.number({error: "Display order cannot be empty"})),
    images: z.array(z.url({ error: "Category images should array of URL" })),
    description: z.string({ error: "Category description cannot be empty" }),
    is_active: z.coerce.boolean().optional().default(true),
    specifications: z.record(z.string(), z.string(), {
      error: "Specification must key and value pairs",
    }).optional(),
  }),
});

export const update_category = z.object({
  body: create_category.shape.body.partial().extend({
    id: z.string({ error: "Category ID must required" }),
  }),
});

export const delete_category = z.object({
  body: z.object({
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
