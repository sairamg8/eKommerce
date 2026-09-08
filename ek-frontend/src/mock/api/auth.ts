import type { Session, User } from "../types";
import { respond, DELAY, MockApiError } from "../core/latency";
import { userByEmail, users, adminUser, customers, merchants, agents } from "../db";

const TOKEN_TTL = 900; // seconds — matches a 15-minute access token

const token = (u: User) => `mock.${btoa(`${u.id}:${u.role}`)}.jwt`;

/** POST /auth/login — any password works in the prototype. */
export function login(email: string, password: string): Promise<Session> {
  return respond(() => {
    if (!email.trim()) throw new MockApiError(422, "Email is required", { email: ["Email is required"] });
    if (password.length < 8) {
      throw new MockApiError(422, "Password must be at least 8 characters", {
        password: ["Password must be at least 8 characters"],
      });
    }
    const user = userByEmail(email);
    if (!user) throw new MockApiError(401, "No account found with those credentials");
    if (!user.is_active) throw new MockApiError(403, "This account has been deactivated");
    return { user, access_token: token(user), expires_in: TOKEN_TTL };
  }, DELAY.normal);
}

/** POST /auth/register */
export function register(input: {
  first_name: string; last_name: string; email: string;
  password: string; confirm_password: string;
}): Promise<Session> {
  return respond(() => {
    const errors: Record<string, string[]> = {};
    if (!input.first_name.trim()) errors.first_name = ["First name is required"];
    if (!input.last_name.trim()) errors.last_name = ["Last name is required"];
    if (!/^\S+@\S+\.\S+$/.test(input.email)) errors.email = ["Enter a valid email address"];
    if (input.password.length < 8) errors.password = ["Password must be at least 8 characters"];
    if (input.password !== input.confirm_password) {
      errors.confirm_password = ["Passwords do not match"];
    }
    if (userByEmail(input.email)) errors.email = ["An account with this email already exists"];
    if (Object.keys(errors).length) throw new MockApiError(422, "Please fix the errors below", errors);

    const user: User = {
      id: `usr_new_${users.length + 1}`,
      first_name: input.first_name.trim(),
      last_name: input.last_name.trim(),
      email: input.email.toLowerCase(),
      role: "customer",
      avatar_hue: 210,
      is_active: true,
      preferences: { newsletter: true, currency: "INR", theme: "light" },
      orders_count: 0,
      lifetime_value: 0,
      created_at: new Date().toISOString(),
      last_login_at: new Date().toISOString(),
    };
    users.push(user);
    return { user, access_token: token(user), expires_in: TOKEN_TTL };
  }, DELAY.slow);
}

export const logout = (): Promise<{ ok: true }> =>
  respond(() => ({ ok: true as const }), DELAY.fast);

/** GET /auth/me — what the UI calls on reload to rehydrate the session. */
export const me = (userId: string): Promise<User> =>
  respond(() => {
    const u = users.find((x) => x.id === userId);
    if (!u) throw new MockApiError(401, "Session expired");
    return u;
  }, DELAY.fast);

/** Prototype-only: the demo accounts the role switcher offers. */
export const demoAccounts = () => ({
  customer: customers[0]!,
  merchant: users.find((u) => u.id === merchants[0]!.owner_user_id)!,
  admin: adminUser,
  agent: agents[0]!,
});
