import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Sociality — Authentication",
  description: "Sign in or register an account on Sociality.",
};

export default function AuthLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-black px-4 py-8">
      <main className="w-full max-w-[345px] rounded-2xl border border-[#1F242F] bg-[#0A0D12] px-4 py-8 md:max-w-[446px] md:px-6 md:py-10 shadow-2xl">
        {children}
      </main>
    </div>
  );
}
