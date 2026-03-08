import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "Sociality",
  description: "Sociality frontend MVP",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" className={cn("font-sans", inter.variable)}>
      <body>
        <header className="border-b">
          <nav className="mx-auto flex max-w-4xl gap-4 p-4 ">
            <Link href="/">Home</Link>
            <Link href="/feed">Feed</Link>
            <Link href="/me">Me</Link>
            <Link href="/profile/nisa">Profile nisa</Link>
          </nav>
        </header>

        <main className="mx-auto max-w-4xl p-4">{children}</main>
      </body>
    </html>
  );
}
