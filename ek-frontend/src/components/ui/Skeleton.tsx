import { cn } from "../../lib/cn";
import s from "./Skeleton.module.css";

export function Skeleton({ w, h, radius, className }: {
  w?: number | string; h?: number | string; radius?: number; className?: string;
}) {
  return (
    <div
      className={cn(s.sk, className)}
      style={{ width: w ?? "100%", height: h ?? 16, borderRadius: radius }}
      aria-hidden
    />
  );
}

export function SkeletonText({ lines = 3, width = "100%" }: { lines?: number; width?: string }) {
  return (
    <div style={{ display: "grid", gap: 8, width }}>
      {Array.from({ length: lines }, (_, i) => (
        <div
          key={i}
          className={cn(s.sk, s.text)}
          style={{ width: i === lines - 1 ? "62%" : "100%" }}
          aria-hidden
        />
      ))}
    </div>
  );
}
