import type {
  InputHTMLAttributes,
  ReactNode,
  Ref,
  TextareaHTMLAttributes,
} from "react";
import { useId } from "react";
import { cn } from "../../lib/cn";
import s from "./Input.module.css";
import type { FieldError } from "react-hook-form";

type FieldProps = {
  label?: string;
  error?: string | FieldError["message"];
  hint?: string;
  required?: boolean;
  children: (id: string) => ReactNode;
};

export function Field({ label, error, hint, required, children }: FieldProps) {
  const id = useId();
  return (
    <div className={s.field}>
      {label && (
        <label className={s.label} htmlFor={id}>
          {label}
          {required && <span className={s.req}>*</span>}
        </label>
      )}
      {children(id)}
      {error ? (
        <span className={s.error}>{error}</span>
      ) : hint ? (
        <span className={s.hint}>{hint}</span>
      ) : null}
    </div>
  );
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  hint?: string;
  icon?: ReactNode;
  ref?: Ref<HTMLInputElement>;
};

export function Input({
  label,
  error,
  hint,
  icon,
  className,
  required,
  ref,
  ...rest
}: InputProps) {
  return (
    <Field label={label} error={error} hint={hint} required={required}>
      {(id) => (
        <div className={s.wrap}>
          {icon && <span className={s.icon}>{icon}</span>}
          <input
            ref={ref}
            id={id}
            aria-invalid={!!error}
            className={cn(
              s.control,
              icon && s.hasIcon,
              error && s.invalid,
              className,
            )}
            {...rest}
          />
        </div>
      )}
    </Field>
  );
}

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  error?: string;
  hint?: string;
};

export function Textarea({
  label,
  error,
  hint,
  className,
  required,
  ...rest
}: TextareaProps) {
  return (
    <Field label={label} error={error} hint={hint} required={required}>
      {(id) => (
        <textarea
          id={id}
          aria-invalid={!!error}
          className={cn(s.control, s.textarea, error && s.invalid, className)}
          {...rest}
        />
      )}
    </Field>
  );
}
