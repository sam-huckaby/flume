import type { Metadata } from "next";
import Link from "next/link";
import React from "react";

export const metadata: Metadata = {
  title: "Flume",
  description: "Flume platform for SDK-compiled AI browser games"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "sans-serif", margin: 0, background: "#0b1020", color: "#e6edf7" }}>
        <header style={{ padding: "12px 20px", borderBottom: "1px solid #2a3553" }}>
          <nav style={{ display: "flex", gap: 16 }}>
            <Link href="/">Home</Link>
            <Link href="/games">Games</Link>
            <Link href="/developer">Developer</Link>
            <Link href="/moderator">Moderator</Link>
          </nav>
        </header>
        <main style={{ padding: 20 }}>{children}</main>
      </body>
    </html>
  );
}
