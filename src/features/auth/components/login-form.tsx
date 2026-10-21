"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/features/auth/components/password-input";
import { loginSchema, type LoginInput } from "@/features/auth/schemas";
import { cn } from "@/lib/utils";

export interface LoginFormProps {
  readonly onSubmit: (data: LoginInput) => Promise<void> | void;
  readonly serverError?: string | null;
  readonly isLoading?: boolean;
  readonly className?: string;
}

export function LoginForm({
  onSubmit,
  serverError,
  isLoading = false,
  className,
}: Readonly<LoginFormProps>) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleValidSubmit = handleSubmit((data) => {
    return onSubmit(data);
  });

  return (
    <form noValidate onSubmit={handleValidSubmit} className={cn("space-y-4", className)}>
      {serverError ? <Alert variant="danger">{serverError}</Alert> : undefined}

      <Input
        id="login-email"
        label="Email"
        type="email"
        placeholder="name@example.com"
        autoComplete="email"
        error={errors.email?.message}
        disabled={isLoading}
        {...register("email")}
      />

      <PasswordInput
        id="login-password"
        label="Password"
        placeholder="Enter your password"
        autoComplete="current-password"
        error={errors.password?.message}
        disabled={isLoading}
        {...register("password")}
      />

      <Button
        type="submit"
        variant="primary"
        size="md"
        isLoading={isLoading}
        disabled={isLoading}
        className="w-full font-semibold"
      >
        Sign in
      </Button>
    </form>
  );
}
