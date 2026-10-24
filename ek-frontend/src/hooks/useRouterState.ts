import { useLocation } from "react-router-dom";
import type { z, ZodType } from "zod";

export function useRouterState<T extends ZodType>(
  schema: T,
): z.infer<T> | null {
  const { state } = useLocation();
  const parsed = schema.safeParse(state);
  return parsed.success ? parsed.data : null;
}
