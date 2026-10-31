"use client";

import Image from "next/image";
import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/features/auth/components/password-input";
import type { RegisterInput } from "@/features/auth/schemas";

const registrationFields = [
  {
    name: "name", label: "Name", type: "text", autoComplete: "name",
    placeholder: "Enter your name",
  },
  {
    name: "username", label: "Username", type: "text", autoComplete: "username",
    placeholder: "Enter your username",
  },
  {
    name: "email", label: "Email", type: "email", autoComplete: "email",
    placeholder: "Enter your email",
  },
  {
    name: "phone", label: "Number Phone", type: "tel", autoComplete: "tel",
    placeholder: "Enter your number phone",
  },
  {
    name: "password", label: "Password", type: "password", autoComplete: "new-password",
    placeholder: "Enter your password",
  },
  {
    name: "confirmPassword", label: "Confirm Password", type: "password", autoComplete: "new-password",
    placeholder: "Enter your confirm password",
  },
] as const;

interface RegisterFieldsProps {
  readonly register: UseFormRegister<RegisterInput>;
  readonly errors: FieldErrors<RegisterInput>;
  readonly disabled: boolean;
}

export function RegisterFields({ register, errors, disabled }: RegisterFieldsProps) {
  return registrationFields.map(({ name, type, ...field }) => {
    const fieldProps = {
      ...field, ...register(name), id: `register-${name}`,
      error: errors[name]?.message, disabled, required: name !== "phone",
    };
    return type === "password" ? (
      <PasswordInput
        key={name}
        {...fieldProps}
        visibilityIcon={<Image src="/images/auth/eye.svg" width={20} height={20} alt="" />}
      />
    ) : <Input key={name} {...fieldProps} type={type} />;
  });
}
