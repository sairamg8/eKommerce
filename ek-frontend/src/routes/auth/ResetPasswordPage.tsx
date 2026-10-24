import { AuthLayout } from "../../components/layout/AuthLayout";
import { Button } from "../../components/ui/Button";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useReset_passwordMutation } from "../../store/slices/auth/auth_api";
import { reset_password_schema, type ResetPasswordT } from "../../types/User";
import { Navigate, useSearchParams } from "react-router-dom";
import type { Page_NotificationT } from "../../types";

export function ResetPasswordPage() {
  const [params] = useSearchParams();

  if (!params.get("token")) {
    <Navigate to={"/not-found"} replace />;
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordT>({
    defaultValues: {
      password: "",
      confirm_password: "",
    },
    mode: "onChange",
    resolver: zodResolver(reset_password_schema),
  });

  const [reset_password, { isLoading }] = useReset_passwordMutation();

  const submit = async (e: ResetPasswordT) => {
    const { error } = await reset_password({
      password: e.password,
      token: params.get("token")!,
    });

    if (!error) {
      <Navigate
        to="/login"
        replace
        state={
          {
            template: {
              msg: "Please re login with new credentials",
              type: "toast",
            },
          } as Page_NotificationT
        }
      />;
    }
  };

  return (
    <AuthLayout title="Reset password" subtitle="">
      <Card>
        <CardHeader
          title="Fill the form"
          subtitle="Your password will be reset"
        />
        <CardBody>
          <form className="flex flex-row" onSubmit={handleSubmit(submit)}>
            <div className="flex flex-col pb-16">
              <Input
                label="Password"
                type="password"
                {...register("password")}
                error={errors["password"]?.message}
              />

              <Input
                label="Confirm Password"
                type="password"
                {...register("confirm_password")}
                error={errors["confirm_password"]?.message}
              />
            </div>
            <Button
              type="submit"
              size="lg"
              block
              disabled={isLoading}
              loading={isLoading}
            >
              Reset password
            </Button>
          </form>
        </CardBody>
      </Card>
    </AuthLayout>
  );
}
