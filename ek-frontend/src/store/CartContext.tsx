import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Cart } from "../mock/types";
import * as cartApi from "../mock/api/cart";
import { useToast } from "./ToastContext";

type CartValue = {
  cart: Cart | null;
  busy: boolean;
  count: number;
  add: (productId: string, qty?: number) => Promise<boolean>;
  setQty: (itemId: string, qty: number) => Promise<void>;
  remove: (itemId: string) => Promise<void>;
  applyCoupon: (code: string) => Promise<boolean>;
  removeCoupon: () => Promise<void>;
  clear: () => Promise<void>;
};

const CartContext = createContext<CartValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [busy, setBusy] = useState(false);
  const { push } = useToast();

  useEffect(() => { void cartApi.getCart().then(setCart); }, []);

  const run = useCallback(async (
    fn: () => Promise<Cart>,
    okMsg?: string,
  ): Promise<boolean> => {
    setBusy(true);
    try {
      setCart(await fn());
      if (okMsg) push(okMsg, "success");
      return true;
    } catch (e) {
      push(e instanceof Error ? e.message : "Something went wrong", "error");
      return false;
    } finally {
      setBusy(false);
    }
  }, [push]);

  const value = useMemo<CartValue>(() => ({
    cart,
    busy,
    count: cart?.items.reduce((s, i) => s + i.quantity, 0) ?? 0,
    add: (id, qty = 1) => run(() => cartApi.addToCart(id, qty), "Added to cart"),
    setQty: async (id, qty) => { await run(() => cartApi.updateQuantity(id, qty)); },
    remove: async (id) => { await run(() => cartApi.removeFromCart(id), "Removed from cart"); },
    applyCoupon: (code) => run(() => cartApi.applyCoupon(code), "Coupon applied"),
    removeCoupon: async () => { await run(() => cartApi.removeCoupon()); },
    clear: async () => { await run(() => cartApi.clearCart()); },
  }), [cart, busy, run]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
