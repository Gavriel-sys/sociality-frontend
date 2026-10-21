import { forwardRef, useId } from "react";
import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  readonly label?: string;
  readonly helperText?: string;
  readonly error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    helperText,
    error,
    id: providedId,
    disabled = false,
    className,
    type = "text",
    "aria-describedby": ariaDescribedBy,
    ...props
  },
  ref,
) {
  const generatedId = useId();
  const inputId = providedId ?? (label ? generatedId : undefined);
  const helperId = helperText ? `${inputId}-helper` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;

  const describedBy = [errorId, helperId, ariaDescribedBy].filter(Boolean).join(" ") || undefined;

  return (
    <div className="flex w-full flex-col gap-1.5 text-left">
      {label ? (
        <label htmlFor={inputId} className="text-sm font-medium text-[#FDFDFD]">
          {label}
        </label>
      ) : undefined}
      <input
        ref={ref}
        id={inputId}
        type={type}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          "h-11 min-h-[44px] w-full rounded-xl border bg-[#0A0D12] px-3.5 text-sm text-[#FDFDFD] placeholder-[#A4A7AE]/60 transition-colors",
          "outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black",
          error
            ? "border-[#B41759] focus-visible:border-[#B41759] focus-visible:ring-[#B41759]"
            : "border-[#1F242F] focus-visible:border-transparent focus-visible:ring-[#7F51F9]",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      />
      {error ? (
        <p id={errorId} role="alert" className="text-xs text-[#B41759]">
          {error}
        </p>
      ) : helperText ? (
        <p id={helperId} className="text-xs text-[#A4A7AE]">
          {helperText}
        </p>
      ) : undefined}
    </div>
  );
});

Input.displayName = "Input";
