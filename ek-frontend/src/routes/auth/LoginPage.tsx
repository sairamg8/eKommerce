import { useEffect, useState } from "react";
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
import { useRouterState } from "../../hooks/useRouterState";
import { login_page_schema } from "../../types/utils";

interface LoginForm {
  email: string;
  password: string;
}

export function LoginPage() {
  const state = useRouterState(login_page_schema);

  const navigate = useNavigate();
  const { push } = useToast();
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  const [signup, { isLoading, isError, isSuccess }] = useLoginMutation();

  const { control, handleSubmit } = useForm<LoginForm>({
    defaultValues: {
      email: "sairamgudiputi8@gmail.com",
      password: "Vishwamitra",
    },
  });

  useEffect(() => {
    if (state?.template.type === "toast") {
      push(state?.template.msg);
    }
  }, [state?.template]);

  const submit = async (e: LoginForm) => {
    await signup(e);
    console.log({ isError, isSuccess });
    if (isError) return;
    push("User logged in successfully");
    navigate("/");
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
          <Link to="/forgot-password" className={s.link}>
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
