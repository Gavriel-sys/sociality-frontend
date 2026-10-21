"use client";

import { forwardRef, useId, useState } from "react";
import { Eye, EyeOff } from "@/components/ui/icons";
import { Input, type InputProps } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type PasswordInputProps = Omit<InputProps, "type">;

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput(
    { label, helperText, error, id: providedId, disabled = false, className, ...props },
    ref,
  ) {
    const [isVisible, setIsVisible] = useState(false);
    const generatedId = useId();
    const inputId = providedId ?? (label ? generatedId : undefined);

    const toggleVisibility = () => {
      setIsVisible((prev) => !prev);
    };

    return (
      <div className="flex w-full flex-col gap-1.5 text-left">
        {label ? (
          <label htmlFor={inputId} className="text-sm font-medium text-[#FDFDFD]">
            {label}
          </label>
        ) : undefined}
        <div className="relative w-full">
          <Input
            ref={ref}
            id={inputId}
            type={isVisible ? "text" : "password"}
            error={error}
            helperText={helperText}
            disabled={disabled}
            className={cn("pr-12", className)}
            {...props}
          />
          <button
            type="button"
            onClick={toggleVisibility}
            disabled={disabled}
            aria-label={isVisible ? "Hide password" : "Show password"}
            className="absolute right-0 top-0 flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-[#A4A7AE] transition-colors hover:text-[#FDFDFD] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7F51F9] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isVisible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
      </div>
    );
  },
);

PasswordInput.displayName = "PasswordInput";
