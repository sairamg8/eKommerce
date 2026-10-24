import { AuthLayout } from "../../components/layout/AuthLayout";
import { Button } from "../../components/ui/Button";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { useForm } from "react-hook-form";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForgot_passwordMutation } from "../../store/slices/auth/auth_api";

const ForgotPasswordSchema = z.object({
  email: z.email({ error: "Valid email required" }),
});

export function ForgotPasswordPage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<{
    email: string;
  }>({
    defaultValues: {
      email: "johndoe@gmail.com",
    },
    mode: "onChange",
    resolver: zodResolver(ForgotPasswordSchema),
  });

  const [reset_password, { isLoading }] = useForgot_passwordMutation();

  const submit = (e: z.infer<typeof ForgotPasswordSchema>) => {
    reset_password(e);
  };

  return (
    <AuthLayout
      title="Reset password"
      subtitle="If your email registered with us you will receive a reset password link"
    >
      <Card>
        <CardHeader
          title="Email us"
          subtitle="We reply to the address you give here"
        />
        <CardBody>
          <form className="flex flex-row" onSubmit={handleSubmit(submit)}>
            <div className="flex flex-col pb-16">
              <Input
                label="Email"
                type="string"
                {...register("email")}
                error={errors["email"]?.message}
              />
            </div>
            <Button
              type="submit"
              size="lg"
              block
              disabled={isLoading}
              loading={isLoading}
            >
              Get Link
            </Button>
          </form>
        </CardBody>
      </Card>
    </AuthLayout>
  );
}
