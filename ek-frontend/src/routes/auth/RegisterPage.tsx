import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import * as authApi from "../../mock/api/auth";
import { AuthLayout } from "../../components/layout/AuthLayout";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { useAuth } from "../../store/AuthContext";
import { useToast } from "../../store/ToastContext";
import s from "../../components/layout/AuthLayout.module.css";

/** Mirrors the register_schema already in ek-backend/src/schema/auth.ts. */
export function RegisterPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const { push } = useToast();
  const [form, setForm] = useState({
    first_name: "", last_name: "", email: "", password: "", confirm_password: "",
  });
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [busy, setBusy] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const strength = (() => {
    const p = form.password;
    let n = 0;
    if (p.length >= 8) n++;
    if (/[A-Z]/.test(p)) n++;
    if (/\d/.test(p)) n++;
    if (/[^A-Za-z0-9]/.test(p)) n++;
    return n;
  })();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) { push("Please accept the terms to continue", "error"); return; }
    setBusy(true);
    setErrors({});
    try {
      const session = await authApi.register(form);
      signIn(session.user);
      push(`Account created — welcome, ${session.user.first_name}`, "success");
      navigate("/account/orders");
    } catch (err) {
      const e2 = err as { errors?: Record<string, string[]>; message?: string };
      setErrors(e2.errors ?? {});
      push(e2.message ?? "Could not create the account", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout title="Create your account" subtitle="Shop, track orders and talk to merchants.">
      <form className={s.fields} onSubmit={submit}>
        <div className={s.two}>
          <Input label="First name" required value={form.first_name}
                 error={errors.first_name?.[0]} onChange={set("first_name")} />
          <Input label="Last name" required value={form.last_name}
                 error={errors.last_name?.[0]} onChange={set("last_name")} />
        </div>
        <Input label="Email address" type="email" required value={form.email}
               error={errors.email?.[0]} onChange={set("email")} placeholder="you@example.in" />
        <div>
          <Input label="Password" type="password" required value={form.password}
                 error={errors.password?.[0]} onChange={set("password")}
                 hint="At least 8 characters" />
          {form.password && (
            <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
              {[0, 1, 2, 3].map((i) => (
                <span key={i} style={{
                  height: 3, flex: 1, borderRadius: 2,
                  background: i < strength
                    ? strength <= 1 ? "var(--danger-solid)"
                      : strength === 2 ? "var(--warning-solid)" : "var(--success-solid)"
                    : "var(--surface-active)",
                }} />
              ))}
            </div>
          )}
        </div>
        <Input label="Confirm password" type="password" required value={form.confirm_password}
               error={errors.confirm_password?.[0]} onChange={set("confirm_password")}
               hint="Checked on the server too, not just here" />
        <label className={s.check}>
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
          <span>I agree to the terms of service and privacy policy</span>
        </label>
        <Button type="submit" size="lg" block disabled={busy}>
          {busy ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <p className={s.foot}>
        Already have an account? <Link to="/login" className={s.link}>Sign in</Link>
      </p>
      <p className={s.foot} style={{ fontSize: "var(--fs-sm)", color: "var(--text-muted)" }}>
        Want to sell instead? <Link to="/sell" className={s.link}>Apply as a merchant</Link>
      </p>
    </AuthLayout>
  );
}
