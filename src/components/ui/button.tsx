import type { ButtonHTMLAttributes, ReactNode } from "react";
import { SpinnerIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "outline" | "ghost" | "destructive" | "icon";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  readonly isLoading?: boolean;
  readonly children?: ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-[#6936F2] text-[#FDFDFD] hover:bg-[#7F51F9] active:scale-[0.98] border border-transparent shadow-sm",
  outline:
    "bg-transparent text-[#FDFDFD] border border-[#1F242F] hover:bg-[#0A0D12] hover:border-[#A4A7AE]/40 active:scale-[0.98]",
  ghost:
    "bg-transparent text-[#A4A7AE] hover:text-[#FDFDFD] hover:bg-[#141820] border border-transparent active:scale-[0.98]",
  destructive:
    "bg-[#B41759] text-[#FDFDFD] hover:bg-[#D1206D] active:scale-[0.98] border border-transparent shadow-sm",
  icon:
    "bg-transparent text-[#A4A7AE] hover:text-[#FDFDFD] hover:bg-[#141820] border border-transparent rounded-full p-2.5",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-11 px-3 text-sm min-h-[44px] min-w-[44px]",
  md: "h-11 px-5 text-sm min-h-[44px] min-w-[44px]",
  lg: "h-12 px-6 text-base min-h-[48px] min-w-[48px]",
};

export function Button({
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled = false,
  className,
  children,
  type = "button",
  ...props
}: Readonly<ButtonProps>) {
  const isIconButton = variant === "icon";
  const appliedSizeClass = isIconButton ? "h-11 w-11 min-h-[44px] min-w-[44px]" : sizeStyles[size];

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      aria-busy={isLoading ? "true" : undefined}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-150 select-none",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7F51F9] focus-visible:ring-offset-2 focus-visible:ring-offset-black",
        "disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed",
        variantStyles[variant],
        appliedSizeClass,
        className,
      )}
      {...props}
    >
      {isLoading ? (
        <>
          <SpinnerIcon className="h-4 w-4 shrink-0 text-current" />
          <span className="sr-only">Loading</span>
          {isIconButton ? undefined : children}
        </>
      ) : (
        children
      )}
    </button>
  );
}
