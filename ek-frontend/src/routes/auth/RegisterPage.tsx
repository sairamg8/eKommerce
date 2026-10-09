import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthLayout } from "../../components/layout/AuthLayout";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { useAuth } from "../../store/AuthContext";
import { useToast } from "../../store/ToastContext";
import s from "../../components/layout/AuthLayout.module.css";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signup } from "./Schema";
import type { SignupT } from "../../types/User";
import { useSignupMutation } from "../../store/slices/auth/auth_api";

/** Mirrors the register_schema already in ek-backend/src/schema/auth.ts. */
export function RegisterPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const { push } = useToast();
  const [Signup, { isLoading }] = useSignupMutation();
  const {
    control,
    handleSubmit,
    watch,
    setError,
    formState: { errors },
  } = useForm<SignupT>({
    resolver: zodResolver(signup),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      password: "",
      confirm_password: "",
      preferences: {},
    },
    mode: "onChange",
  });

  const confirm_password_ref = useRef<HTMLInputElement>(null);

  const [agreed, setAgreed] = useState(false);

  const password_value = watch("password") || "";

  const strength = (() => {
    let n = 0;
    if (password_value.length >= 8) n++;
    if (/[A-Z]/.test(password_value)) n++;
    if (/\d/.test(password_value)) n++;
    if (/[^A-Za-z0-9]/.test(password_value)) n++;
    return n;
  })();

  const submit = async (e: SignupT) => {
    const { confirm_password, ...rest } = e;
    Signup(rest);
  };

  const handle_validate_password = () => {
    const password = watch("password");
    const value = confirm_password_ref.current?.value;

    if (password.trim() !== value?.trim()) {
      setError("password", {
        message: "Confirm password and password must be same",
      });
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Shop, track orders and talk to merchants."
    >
      <form className={s.fields} onSubmit={handleSubmit(submit)}>
        <div className={s.two}>
          <Controller
            control={control}
            name="first_name"
            render={({ field, formState: { errors } }) => {
              return (
                <Input
                  label="First name"
                  required
                  {...field}
                  error={errors.first_name?.message}
                />
              );
            }}
          />

          <Controller
            control={control}
            name="last_name"
            render={({ field, formState: { errors } }) => {
              return (
                <Input
                  label="Last name"
                  required
                  {...field}
                  error={errors.last_name?.message}
                />
              );
            }}
          />
        </div>
        <Controller
          control={control}
          name="email"
          render={({ field, formState: { errors } }) => {
            return (
              <Input
                label="Email"
                required
                {...field}
                error={errors.last_name?.message}
              />
            );
          }}
        />
        <div>
          <Controller
            control={control}
            name="password"
            render={({ field, formState: { errors } }) => {
              return (
                <Input
                  type="password"
                  label="Password"
                  required
                  {...field}
                  error={errors.last_name?.message}
                  hint="At least 8 characters"
                />
              );
            }}
          />
          <div
            style={{ display: "flex", gap: 4, marginTop: 6, marginBottom: 12 }}
          >
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                style={{
                  height: 3,
                  flex: 1,
                  borderRadius: 2,
                  background:
                    i < strength
                      ? strength <= 1
                        ? "var(--danger-solid)"
                        : strength === 2
                          ? "var(--warning-solid)"
                          : "var(--success-solid)"
                      : "var(--surface-active)",
                }}
              />
            ))}
          </div>

          <Controller
            control={control}
            name="confirm_password"
            render={({ field }) => {
              return (
                <Input
                  type="password"
                  label="Confirm password"
                  {...field}
                  error={errors["confirm_password"]?.message}
                />
              );
            }}
          />
        </div>

        <label className={s.check}>
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
          />
          <span>I agree to the terms of service and privacy policy</span>
        </label>
        <Button type="submit" size="lg" block disabled={isLoading || !agreed}>
          {isLoading ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <p className={s.foot}>
        Already have an account?{" "}
        <Link to="/login" className={s.link}>
          Sign in
        </Link>
      </p>
      <p
        className={s.foot}
        style={{ fontSize: "var(--fs-sm)", color: "var(--text-muted)" }}
      >
        Want to sell instead?{" "}
        <Link to="/sell" className={s.link}>
          Apply as a merchant
        </Link>
      </p>
    </AuthLayout>
  );
}
