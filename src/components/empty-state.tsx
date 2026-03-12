import Link from "next/link";
import { Button } from "@/components/ui/button";

type EmptyStateProps = {
  title: string;
  description: string;
  ctaLabel?: string;
  ctaHref?: string;
};

export function EmptyState({
  title,
  description,
  ctaLabel,
  ctaHref,
}: EmptyStateProps) {
  return (
    <div className="rounded-[32px] border border-white/10 bg-white/[0.03] p-8 text-center shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-sm">
      <div className="mx-auto max-w-xl space-y-3">
        <h3 className="text-2xl font-semibold text-white">{title}</h3>
        <p className="text-sm leading-6 text-white/65">{description}</p>
        {ctaLabel && ctaHref ? (
          <Button asChild className="mt-3 h-11 rounded-full px-6">
            <Link href={ctaHref}>{ctaLabel}</Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
}
