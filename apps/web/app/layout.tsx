import type { Metadata } from "next";
import Link from "next/link";
import React from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Flume",
  description: "Flume platform for SDK-compiled AI browser games"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="shell">
          <header className="site-header">
            <div className="site-header__inner">
              <Link className="brand" href="/">
                <span aria-hidden="true" className="brand-mark">
                  F
                </span>
                <span className="brand-copy">
                  <span className="brand-title">Flume</span>
                  <span className="brand-subtitle">Trusted release pipeline for browser AI games</span>
                </span>
              </Link>
              <nav className="site-nav">
                <Link className="nav-link" href="/">
                  Home
                </Link>
                <Link className="nav-link" href="/games">
                  Games
                </Link>
                <Link className="nav-link nav-link--highlight" href="/developer">
                  Developer portal
                </Link>
                <Link className="nav-link" href="/moderator">
                  Moderator
                </Link>
              </nav>
            </div>
          </header>
          <main className="site-main">{children}</main>
        </div>
      </body>
    </html>
  );
}
