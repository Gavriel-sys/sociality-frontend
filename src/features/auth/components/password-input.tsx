"use client";

import { forwardRef, useId, useState } from "react";
import type { ReactNode } from "react";
import { Eye, EyeOff } from "@/components/ui/icons";
import { Input } from "@/components/ui/input";
import type { InputProps } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface PasswordInputProps extends Omit<InputProps, "type" | "trailingAction"> {
  readonly visibilityIcon?: ReactNode;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput({ label, id: providedId, disabled = false, className, visibilityIcon, ...props }, ref) {
    const [isVisible, setIsVisible] = useState(false);
    const generatedId = useId();
    const inputId = providedId ?? generatedId;
    const passwordLabel = label?.toLowerCase() ?? "password";

    return (
      <Input
        {...props}
        ref={ref}
        id={inputId}
        label={label}
        type={isVisible ? "text" : "password"}
        disabled={disabled}
        className={cn("pr-12", className)}
        trailingAction={
          <button
            type="button"
            onClick={() => setIsVisible((wasVisible) => !wasVisible)}
            disabled={disabled}
            aria-label={`${isVisible ? "Hide" : "Show"} ${passwordLabel}`}
            aria-controls={inputId}
            aria-pressed={isVisible}
            className="absolute right-0 top-0 flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          >
            {visibilityIcon ?? (isVisible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />)}
          </button>
        }
      />
    );
  },
);

PasswordInput.displayName = "PasswordInput";
