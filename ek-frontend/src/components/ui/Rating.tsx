import { cn } from "../../lib/cn";
import { Icon } from "./Icon";
import s from "./Rating.module.css";

export function Rating({ value, count, size = 13, showValue = true }: {
  value: number; count?: number; size?: number; showValue?: boolean;
}) {
  const rounded = Math.round(value);
  return (
    <span className={s.row}>
      <span className={s.stars}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Icon key={i} name="star" size={size} fill={i <= rounded}
                className={cn(i > rounded && s.off)} strokeWidth={1.5} />
        ))}
      </span>
      {showValue && value > 0 && <span className={s.value}>{value.toFixed(1)}</span>}
      {count != null && <span className={s.count}>({count})</span>}
    </span>
  );
}
