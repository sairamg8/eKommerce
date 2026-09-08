import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/cn";
import s from "./Button.module.css";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "subtle";
  size?: "sm" | "md" | "lg";
  block?: boolean;
  iconOnly?: boolean;
  children?: ReactNode;
};

export function Button({
  variant = "primary", size = "md", block, iconOnly,
  className, children, ...rest
}: Props) {
  return (
    <button
      className={cn(s.btn, s[variant], s[size], block && s.block, iconOnly && s.iconOnly, className)}
      {...rest}
    >
      {children}
    </button>
  );
}
