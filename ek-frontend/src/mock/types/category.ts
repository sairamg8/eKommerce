/** Self-referencing tree, per the standing Category Schema decision. */
export type Category = {
  id: string;
  parent_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  /** Materialised depth — saves a recursive CTE on every read. */
  depth: number;
  product_count: number;
  is_active: boolean;
  created_at: string;
};

export type CategoryNode = Category & { children: CategoryNode[] };
