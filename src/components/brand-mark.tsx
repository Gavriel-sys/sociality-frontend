import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return <LoaderCircle className={cn("h-5 w-5 text-white", className)} strokeWidth={2.2} />;
}

export function Brand({
  className,
  titleClassName,
  subtitle,
}: {
  className?: string;
  titleClassName?: string;
  subtitle?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.02]">
        <BrandMark className="h-5 w-5" />
      </div>
      <div>
        <p className={cn("text-[1.05rem] font-semibold leading-none tracking-tight text-white sm:text-3xl sm:leading-none", titleClassName)}>
          Sociality
        </p>
        {subtitle ? <p className="mt-1 text-xs text-white/42">{subtitle}</p> : null}
      </div>
    </div>
  );
}

