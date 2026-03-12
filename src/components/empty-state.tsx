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
    <div className="rounded-[24px] border border-white/10 bg-[#050b16]/88 px-6 py-8 text-center shadow-[0_20px_50px_rgba(0,0,0,0.32)] backdrop-blur-sm">
      <div className="mx-auto max-w-xl space-y-3">
        <h3 className="text-xl font-semibold text-white sm:text-2xl">{title}</h3>
        <p className="text-sm leading-7 text-white/58">{description}</p>
        {ctaLabel && ctaHref ? (
          <Button asChild className="mt-3 h-11 rounded-full px-6">
            <Link href={ctaHref}>{ctaLabel}</Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
}
