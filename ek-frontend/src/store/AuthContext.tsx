import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { DeliveryAgent, Merchant, User } from "../mock/types";
import { adminUser, customers, merchants, agents, users } from "../mock/db";

export type Persona = "guest" | "customer" | "merchant" | "admin" | "agent";

type AuthValue = {
  persona: Persona;
  user: User | null;
  merchant: Merchant | null;
  agent: DeliveryAgent | null;
  isAuthed: boolean;
  signIn: (user: User) => void;
  signOut: () => void;
  /** Prototype-only shortcut so every portal is reachable from the switcher. */
  switchPersona: (p: Persona) => void;
};

const AuthContext = createContext<AuthValue | null>(null);

const demoCustomer = customers[0]!;
const demoMerchant = merchants[0]!;
const demoMerchantUser = users.find((u) => u.id === demoMerchant.owner_user_id)!;
const demoAgent = agents[0]!;
// The delivery agent is not a `users` row in this prototype, so synthesise one
// rather than borrowing the merchant owner's identity.
const [agentFirst = "", agentLast = ""] = demoAgent.name.split(" ");
const demoAgentUser: User = {
  id: `usr_${demoAgent.id}`,
  first_name: agentFirst,
  last_name: agentLast,
  email: `${agentFirst.toLowerCase()}@${demoAgent.courier_name.toLowerCase().replace(/[^a-z]/g, "")}.in`,
  role: "customer",
  avatar_hue: demoAgent.hue,
  is_active: true,
  preferences: { newsletter: false, currency: "INR", theme: "light" },
  orders_count: 0,
  lifetime_value: 0,
  created_at: new Date().toISOString(),
  last_login_at: new Date().toISOString(),
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [persona, setPersona] = useState<Persona>("guest");
  const [user, setUser] = useState<User | null>(null);

  const switchPersona = useCallback((p: Persona) => {
    setPersona(p);
    if (p === "guest") setUser(null);
    else if (p === "customer") setUser(demoCustomer);
    else if (p === "merchant") setUser(demoMerchantUser);
    else if (p === "admin") setUser(adminUser);
    else if (p === "agent") setUser(demoAgentUser);
  }, []);

  const signIn = useCallback((u: User) => {
    setUser(u);
    setPersona(u.role === "admin" ? "admin" : u.role === "merchant" ? "merchant" : "customer");
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
    setPersona("guest");
  }, []);

  const value = useMemo<AuthValue>(() => ({
    persona,
    user,
    merchant: persona === "merchant" ? demoMerchant : null,
    agent: persona === "agent" ? demoAgent : null,
    isAuthed: persona !== "guest",
    signIn,
    signOut,
    switchPersona,
  }), [persona, user, signIn, signOut, switchPersona]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
