import type { HTMLAttributes, ReactNode } from "react";

export interface Card extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}
