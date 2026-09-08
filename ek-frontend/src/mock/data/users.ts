import type { User } from "../types";
import { daysAgo, makeRng } from "../core/rng";
import { merchants } from "./merchants";

const rng = makeRng(770420);

const CUSTOMERS = [
  "Aditya Sharma", "Priya Menon", "Vikram Reddy", "Sneha Joshi",
  "Rahul Bose", "Ishita Das", "Karthik Iyer", "Neha Gupta",
  "Aman Khurana", "Divya Pillai", "Siddharth Jain", "Ritu Malhotra",
  "Farhan Qureshi", "Lakshmi Nair", "Yash Agarwal", "Pooja Deshpande",
  "Imran Sheikh", "Ananya Chatterjee", "Varun Kulkarni", "Tanvi Shetty",
];

const mk = (
  id: string,
  full: string,
  role: User["role"],
  i: number,
  over: Partial<User> = {},
): User => {
  const [first = "", last = ""] = full.split(" ");
  return {
    id,
    first_name: first,
    last_name: last,
    email: `${first.toLowerCase()}.${last.toLowerCase()}@example.in`,
    role,
    avatar_hue: (i * 61 + 23) % 360,
    is_active: true,
    preferences: {
      newsletter: rng.chance(0.6),
      currency: "INR",
      theme: rng.chance(0.3) ? "dark" : "light",
    },
    orders_count: 0,
    lifetime_value: 0,
    created_at: daysAgo(rng.int(20, 340)),
    last_login_at: daysAgo(rng.int(0, 21)),
    ...over,
  };
};

export const adminUser: User = mk("usr_admin", "Sairam Gudiputi", "admin", 0, {
  email: "admin@ekommerce.in",
  created_at: daysAgo(365),
  last_login_at: daysAgo(0),
});

export const merchantUsers: User[] = merchants.map((m, i) =>
  mk(m.owner_user_id, m.owner_name, "merchant", i + 1, { email: m.email }),
);

export const customers: User[] = CUSTOMERS.map((name, i) =>
  mk(`usr_c${String(i + 1).padStart(2, "0")}`, name, "customer", i + 8),
);

export const users: User[] = [adminUser, ...merchantUsers, ...customers];

export const userById = (id: string) => users.find((u) => u.id === id);
export const userByEmail = (email: string) =>
  users.find((u) => u.email.toLowerCase() === email.toLowerCase());
