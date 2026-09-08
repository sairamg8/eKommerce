import type { ReactNode } from "react";

export interface HeaderProps {
  children?: ReactNode;
}

export interface HeaderItem {
  children: ReactNode;
  elementStyles?: string;
}
