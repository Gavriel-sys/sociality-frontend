import type { Metadata } from "next";
import type { ReactNode } from "react";
import styles from "./layout.module.css";

export const metadata: Metadata = {
  title: "Sociality — Authentication",
  description: "Sign in or register an account on Sociality.",
};

export default function AuthLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className={styles.canvas}>
      <div aria-hidden="true" className={styles.glow} />
      <main className={styles.card}>{children}</main>
    </div>
  );
}
