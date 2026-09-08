import type { SelectHTMLAttributes } from "react";
import { cn } from "../../lib/cn";
import { Field } from "./Input";
import s from "./Select.module.css";

export type Option = { value: string; label: string };

type Props = Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> & {
  label?: string; error?: string; hint?: string;
  options: Option[]; dense?: boolean;
};

export function Select({ label, error, hint, options, dense, className, ...rest }: Props) {
  return (
    <Field label={label} error={error} hint={hint}>
      {(id) => (
        <div className={s.wrap}>
          <select id={id} className={cn(s.select, dense && s.sm, className)} {...rest}>
            {options.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <svg className={s.chev} width="14" height="14" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>
      )}
    </Field>
  );
}
