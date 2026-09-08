export type Role = "customer" | "merchant" | "admin";

export type User = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: Role;
  avatar_hue: number;
  is_active: boolean;
  /** jsonb column — free-form, per progress.txt */
  preferences: { newsletter: boolean; currency: string; theme: "light" | "dark" };
  orders_count: number;
  lifetime_value: number;
  created_at: string;
  last_login_at: string | null;
};

export type Address = {
  id: string;
  user_id: string;
  label: string;
  recipient: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
  is_default: boolean;
};

export type Session = {
  user: User;
  access_token: string;
  /** Seconds until the access token expires — drives the refresh timer. */
  expires_in: number;
};
