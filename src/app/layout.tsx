import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Navbar } from "@/components/navbar";
import { FloatingNav } from "@/components/floating-nav";

export const metadata: Metadata = {
  title: "Sociality",
  description: "Sociality frontend MVP",
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className="min-h-screen bg-black text-white antialiased">
        <Providers>
          <div className="relative min-h-screen overflow-x-hidden bg-black">
            <Navbar />
            <main className="min-h-screen pb-28">{children}</main>
            <FloatingNav />
          </div>
        </Providers>
      </body>
    </html>
  );
}
