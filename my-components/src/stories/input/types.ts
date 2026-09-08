import type { ChangeEvent, InputHTMLAttributes, ReactNode } from "react";

export interface Props {
  value?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  id?: string;
  dataTestId?: string;
  msg?: string;
  className?: string;
  onStartIconClick?: () => void;
  onEndIconClick?: () => void;
  inputProps?: Omit<InputHTMLAttributes<HTMLInputElement>, "className"> & {
    htmlFor?: string;
    label?: string;
    className?: string;
    startIcon?: ReactNode;
    endIcon?: ReactNode;
  };
}
