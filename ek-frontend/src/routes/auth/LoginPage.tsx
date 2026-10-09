import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthLayout } from "../../components/layout/AuthLayout";
import { Button } from "../../components/ui/Button";
import { Icon } from "../../components/ui/Icon";
import { Input } from "../../components/ui/Input";
import { useToast } from "../../store/ToastContext";
import s from "../../components/layout/AuthLayout.module.css";
import { Controller, useForm } from "react-hook-form";
import { DevTool } from "@hookform/devtools";
import { useLoginMutation } from "../../store/slices/auth/auth_api";

interface LoginForm {
  email: string;
  password: string;
}

export function LoginPage() {
  const navigate = useNavigate();
  const { push } = useToast();
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  const [signup, { isLoading }] = useLoginMutation();

  const { control, handleSubmit } = useForm<LoginForm>({
    defaultValues: {
      email: "sairamgudiputi8@gmail.com",
      password: "Vishwamitra",
    },
  });

  const submit = async (e: LoginForm) => {
    signup(e);
  };

  return (
    <AuthLayout
      title="Sign in"
      subtitle="Welcome back — pick up where you left off."
    >
      <form className={s.fields} onSubmit={handleSubmit(submit)}>
        <Controller
          name="email"
          control={control}
          rules={{
            required: {
              value: true,
              message: "Email cannot be empty",
            },
          }}
          render={({ field, formState: { errors } }) => {
            return (
              <Input
                label="Email address"
                type="text"
                {...field}
                placeholder="you@example.in"
                error={errors.email?.message}
                icon={<Icon name="user" size={15} />}
              />
            );
          }}
        />

        <Controller
          name="password"
          control={control}
          rules={{
            required: {
              value: true,
              message: "Password cannot be empty",
            },
          }}
          render={({ field, formState: { errors } }) => {
            return (
              <Input
                label="Password"
                type={show ? "text" : "password"}
                error={errors.password?.message}
                placeholder="At least 8 characters"
                {...field}
              />
            );
          }}
        />

        <div className={s.row}>
          <label className={s.check}>
            <input
              type="checkbox"
              checked={show}
              onChange={(e) => setShow(e.target.checked)}
            />
            Show password
          </label>
          <Link to="/support" className={s.link}>
            Forgot password?
          </Link>
        </div>
        <Button
          type="submit"
          size="lg"
          block
          disabled={busy}
          loading={isLoading}
        >
          {busy ? "Signing in…" : "Sign in"}
        </Button>
      </form>
      <DevTool control={control} />

      <p className={s.foot}>
        New here?{" "}
        <Link to="/register" className={s.link}>
          Create an account
        </Link>
      </p>
    </AuthLayout>
  );
}
