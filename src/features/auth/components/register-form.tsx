"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/features/auth/components/password-input";
import { registerSchema, type RegisterInput } from "@/features/auth/schemas";
import { cn } from "@/lib/utils";

export interface RegisterFormProps {
  readonly onSubmit: (data: RegisterInput) => Promise<void> | void;
  readonly serverError?: string | null;
  readonly isLoading?: boolean;
  readonly className?: string;
}

export function RegisterForm({
  onSubmit,
  serverError,
  isLoading = false,
  className,
}: Readonly<RegisterFormProps>) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      username: "",
      email: "",
      password: "",
      phone: "",
    },
  });

  const handleValidSubmit = handleSubmit((data) => {
    return onSubmit(data);
  });

  return (
    <form noValidate onSubmit={handleValidSubmit} className={cn("space-y-4", className)}>
      {serverError ? <Alert variant="danger">{serverError}</Alert> : undefined}

      <Input
        id="register-name"
        label="Name"
        type="text"
        placeholder="Enter your full name"
        autoComplete="name"
        error={errors.name?.message}
        disabled={isLoading}
        {...register("name")}
      />

      <Input
        id="register-username"
        label="Username"
        type="text"
        placeholder="Enter your username"
        helperText="Letters, numbers, underscores only"
        autoComplete="username"
        error={errors.username?.message}
        disabled={isLoading}
        {...register("username")}
      />

      <Input
        id="register-email"
        label="Email"
        type="email"
        placeholder="name@example.com"
        autoComplete="email"
        error={errors.email?.message}
        disabled={isLoading}
        {...register("email")}
      />

      <PasswordInput
        id="register-password"
        label="Password"
        placeholder="Min. 6 characters"
        autoComplete="new-password"
        error={errors.password?.message}
        disabled={isLoading}
        {...register("password")}
      />

      <Input
        id="register-phone"
        label="Phone number (optional)"
        type="tel"
        placeholder="e.g. 08123456789"
        autoComplete="tel"
        error={errors.phone?.message}
        disabled={isLoading}
        {...register("phone")}
      />

      <Button
        type="submit"
        variant="primary"
        size="md"
        isLoading={isLoading}
        disabled={isLoading}
        className="w-full font-semibold"
      >
        Create account
      </Button>
    </form>
  );
}
