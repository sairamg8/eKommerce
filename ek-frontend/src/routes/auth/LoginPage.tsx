import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import * as authApi from "../../mock/api/auth";
import { AuthLayout } from "../../components/layout/AuthLayout";
import { Button } from "../../components/ui/Button";
import { Icon } from "../../components/ui/Icon";
import { Input } from "../../components/ui/Input";
import { useAuth } from "../../store/AuthContext";
import { useToast } from "../../store/ToastContext";
import { customers, merchants, adminUser, users } from "../../mock/db";
import s from "../../components/layout/AuthLayout.module.css";

const DEMO = [
  { label: "Customer", email: customers[0]!.email, to: "/account/orders" },
  { label: "Merchant", email: users.find((u) => u.id === merchants[0]!.owner_user_id)!.email, to: "/merchant" },
  { label: "Admin", email: adminUser.email, to: "/admin" },
];

export function LoginPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const { push } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent, override?: { email: string; to: string }) => {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    try {
      const session = await authApi.login(override?.email ?? email, override ? "password123" : password);
      signIn(session.user);
      push(`Welcome back, ${session.user.first_name}`, "success");
      navigate(override?.to ?? (
        session.user.role === "admin" ? "/admin"
        : session.user.role === "merchant" ? "/merchant"
        : "/account/orders"
      ));
    } catch (err) {
      const e2 = err as { errors?: Record<string, string[]>; message?: string };
      setErrors(e2.errors ?? {});
      push(e2.message ?? "Could not sign in", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout title="Sign in" subtitle="Welcome back — pick up where you left off.">
      <form className={s.fields} onSubmit={submit}>
        <Input label="Email address" type="email" required value={email}
               error={errors.email?.[0]} onChange={(e) => setEmail(e.target.value)}
               placeholder="you@example.in" icon={<Icon name="user" size={15} />} />
        <Input label="Password" type={show ? "text" : "password"} required value={password}
               error={errors.password?.[0]} onChange={(e) => setPassword(e.target.value)}
               placeholder="At least 8 characters" />
        <div className={s.row}>
          <label className={s.check}>
            <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} />
            Show password
          </label>
          <Link to="/support" className={s.link}>Forgot password?</Link>
        </div>
        <Button type="submit" size="lg" block disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <div className={s.divider}>or use a demo account</div>

      <div className={s.demo}>
        <span className={s.demoTitle}>Prototype accounts — any password works</span>
        {DEMO.map((d) => (
          <div key={d.label} className={s.demoRow}>
            <strong style={{ width: 74 }}>{d.label}</strong>
            <span className={s.mono}>{d.email}</span>
            <Button size="sm" variant="secondary" disabled={busy}
                    onClick={(e) => void submit(e, { email: d.email, to: d.to })}>
              Use
            </Button>
          </div>
        ))}
      </div>

      <p className={s.foot}>
        New here? <Link to="/register" className={s.link}>Create an account</Link>
        {" · "}
        <Link to="/sell" className={s.link}>Sell on eKommerce</Link>
      </p>
    </AuthLayout>
  );
}
