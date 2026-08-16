import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rabnix Estate — Trusted homes",
  description: "The most trusted place to find a home. Verified listings, responsive listers.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <Link className="brand" href="/">Rabnix Estate</Link>
          <span className="tagline">Trust-first home search</span>
          <nav className="site-nav">
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/post">Post a property</Link>
          </nav>
        </header>
        <main className="container">{children}</main>
        <footer className="site-footer">
          <span>MVP scaffold · see <code>/docs</code></span>
        </footer>
      </body>
    </html>
  );
}
