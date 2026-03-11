import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Navbar } from "@/components/navbar";

export const metadata: Metadata = {
  title: "Sociality",
  description: "Sociality frontend MVP",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-black text-white">
        <Providers>
          <Navbar />
          <main className="min-h-screen bg-black">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
