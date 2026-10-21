import type { HTMLAttributes, ReactNode } from "react";
import { AlertCircleIcon, CheckCircleIcon, CloseIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

export type AlertVariant = "success" | "danger";

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  readonly variant?: AlertVariant;
  readonly title?: string;
  readonly children?: ReactNode;
  readonly onClose?: () => void;
}

const variantStyles: Record<AlertVariant, { container: string; icon: typeof CheckCircleIcon; iconColor: string }> = {
  success: {
    container: "border-emerald-600/30 bg-emerald-950/20 text-emerald-100",
    icon: CheckCircleIcon,
    iconColor: "text-emerald-400",
  },
  danger: {
    container: "border-[#B41759]/40 bg-[#B41759]/15 text-pink-100",
    icon: AlertCircleIcon,
    iconColor: "text-[#B41759]",
  },
};

export function Alert({
  variant = "danger",
  title,
  children,
  onClose,
  className,
  ...props
}: Readonly<AlertProps>) {
  const config = variantStyles[variant];
  const IconComponent = config.icon;

  return (
    <div
      role="alert"
      className={cn(
        "relative flex w-full items-start gap-3 rounded-2xl border p-4 text-sm transition-all",
        config.container,
        className,
      )}
      {...props}
    >
      <IconComponent className={cn("mt-0.5 h-5 w-5 shrink-0", config.iconColor)} />
      <div className="flex-1 space-y-1">
        {title ? <h5 className="font-semibold leading-tight tracking-tight">{title}</h5> : undefined}
        {children ? <div className="text-xs leading-relaxed opacity-90">{children}</div> : undefined}
      </div>
      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss alert"
          className="inline-flex h-8 w-8 min-h-[32px] min-w-[32px] shrink-0 items-center justify-center rounded-lg opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-black"
        >
          <CloseIcon className="h-4 w-4" />
        </button>
      ) : undefined}
    </div>
  );
}
