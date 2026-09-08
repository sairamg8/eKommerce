import s from "./Spinner.module.css";

export function Spinner({ size = 16 }: { size?: number }) {
  return (
    <svg className={s.spin} width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" opacity="0.2" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function LoadingBlock({ label = "Loading…" }: { label?: string }) {
  return (
    <div className={s.center} role="status">
      <Spinner size={22} />
      <span style={{ fontSize: "var(--fs-sm)", marginTop: 10 }}>{label}</span>
    </div>
  );
}
