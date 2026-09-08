import type { Category, CategoryNode } from "../types";
import { daysAgo, slugify } from "../core/rng";

type Seed = { name: string; children: string[] };

const SEED: Seed[] = [
  { name: "Electronics", children: ["Audio", "Wearables", "Cameras"] },
  { name: "Computers", children: ["Laptops", "Peripherals", "Storage"] },
  { name: "Home & Kitchen", children: ["Cookware", "Appliances", "Decor"] },
  { name: "Fashion", children: ["Men", "Women", "Accessories"] },
  { name: "Fitness", children: ["Equipment", "Supplements"] },
  { name: "Books", children: ["Technology", "Business"] },
];

function build(): Category[] {
  const out: Category[] = [];
  let n = 0;
  SEED.forEach((root, ri) => {
    const rootId = `cat_${String(++n).padStart(3, "0")}`;
    out.push({
      id: rootId,
      parent_id: null,
      name: root.name,
      slug: slugify(root.name),
      description: `Everything under ${root.name.toLowerCase()}.`,
      depth: 0,
      product_count: 0,
      is_active: true,
      created_at: daysAgo(300 - ri * 5),
    });
    root.children.forEach((child, ci) => {
      out.push({
        id: `cat_${String(++n).padStart(3, "0")}`,
        parent_id: rootId,
        name: child,
        slug: slugify(`${root.name}-${child}`),
        description: null,
        depth: 1,
        product_count: 0,
        is_active: true,
        created_at: daysAgo(290 - ri * 5 - ci),
      });
    });
  });
  return out;
}

export const categories: Category[] = build();

export const leafCategories = categories.filter((c) => c.depth === 1);

export const categoryById = (id: string) => categories.find((c) => c.id === id);

/** Nested tree — what a category sidebar or admin tree view renders from. */
export function categoryTree(): CategoryNode[] {
  const nodes = new Map<string, CategoryNode>(
    categories.map((c) => [c.id, { ...c, children: [] }]),
  );
  const roots: CategoryNode[] = [];
  for (const node of nodes.values()) {
    if (node.parent_id) nodes.get(node.parent_id)?.children.push(node);
    else roots.push(node);
  }
  return roots;
}
