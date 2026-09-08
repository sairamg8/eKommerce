import clsx from "clsx";
import styles from "./input.module.css";
import type { Props } from "./types";

export default function Input(props: Props) {
  const {
    value,
    onChange,
    dataTestId,
    id,
    msg,
    inputProps,
    onEndIconClick,
    onStartIconClick,
  } = props;
  const { htmlFor, label, className, startIcon, endIcon, ...nativeProps } =
    inputProps || {};

  return (
    <div
      id={id}
      data-test-id={dataTestId}
      className={clsx(styles.wrapperInput, inputProps?.className)}
    >
      <label htmlFor={htmlFor} className={clsx(styles.inputLabel)}>
        {label}
      </label>
      <div className={clsx(styles.inputWrapper)}>
        {startIcon && (
          <button
            aria-label="Start Icon"
            data-test-id={"start_icon"}
            className={clsx(styles["icon"], styles["start_icon"])}
            onClick={onStartIconClick}
          >
            {startIcon}
          </button>
        )}

        <input
          value={value}
          onChange={onChange}
          id={htmlFor || nativeProps?.id}
          className={clsx(className)}
          {...nativeProps}
        />
        {endIcon && (
          <button
            aria-label="End icon"
            data-test-id={"end_icon"}
            className={clsx(styles["icon"], styles["end_icon"])}
            onClick={onEndIconClick}
          >
            {endIcon}
          </button>
        )}
      </div>
      {msg && <p className={styles["input_msg"]}>{msg}</p>}
    </div>
  );
}
