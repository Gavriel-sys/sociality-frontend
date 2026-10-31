"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/features/auth/components/password-input";
import { loginSchema } from "@/features/auth/schemas";
import type { LoginInput } from "@/features/auth/schemas";
import { cn } from "@/lib/utils";
import styles from "./auth-form.module.css";

export interface LoginFormProps {
  readonly onSubmit: (credentials: LoginInput) => Promise<void> | void;
  readonly serverError?: string;
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
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const isBusy = isLoading || isSubmitting;

  return (
    <form noValidate aria-label="Log in" onSubmit={handleSubmit((credentials) => onSubmit(credentials))} className={cn(styles.form, className)}>
      {serverError ? <Alert variant="danger">{serverError}</Alert> : undefined}

      <Input
        id="login-email"
        label="Email"
        type="email"
        placeholder="Enter your email"
        autoComplete="email"
        error={errors.email?.message}
        disabled={isBusy}
        {...register("email")}
      />

      <PasswordInput
        id="login-password"
        label="Password"
        placeholder="Enter your password"
        autoComplete="current-password"
        error={errors.password?.message}
        disabled={isBusy}
        {...register("password")}
      />

      <div className={styles.actions}>
        <Button type="submit" isLoading={isBusy} className={styles.submit}>Log in</Button>
        <p className={styles.footer}>
          Don&apos;t have an account?{" "}
          <Link href="/register" className="rounded font-bold text-accent hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">Sign up</Link>
        </p>
      </div>
    </form>
  );
}
