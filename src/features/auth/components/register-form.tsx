"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { registerSchema } from "@/features/auth/schemas";
import type { RegisterInput } from "@/features/auth/schemas";
import { cn } from "@/lib/utils";
import { RegisterFields } from "./register-fields";
import styles from "./auth-form.module.css";

export interface RegisterFormProps {
  readonly onSubmit: (registration: RegisterInput) => Promise<void> | void;
  readonly serverError?: string;
  readonly isLoading?: boolean;
  readonly className?: string;
}

export function RegisterForm({ onSubmit, serverError, isLoading = false, className }: RegisterFormProps) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", username: "", email: "", phone: "", password: "", confirmPassword: "" },
  });
  const isBusy = isLoading || isSubmitting;

  return (
    <form noValidate aria-label="Register" onSubmit={handleSubmit((registration) => onSubmit(registration))} className={cn(styles.form, className)}>
      {serverError ? <Alert variant="danger">{serverError}</Alert> : undefined}
      <RegisterFields register={register} errors={errors} disabled={isBusy} />
      <div className={styles.actions}>
        <Button type="submit" isLoading={isBusy} className={styles.submit}>Submit</Button>
        <p className={styles.footer}>
          Already have an account?{" "}
          <Link href="/login" className="rounded font-bold text-accent hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">Log in</Link>
        </p>
      </div>
    </form>
  );
}
