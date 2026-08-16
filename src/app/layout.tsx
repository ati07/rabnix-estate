import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { getSessionUser } from "@/lib/auth";
import { LogoutButton } from "./LogoutButton";

export const metadata: Metadata = {
  title: "Rabnix Estate — Trusted homes",
  description: "The most trusted place to find a home. Verified listings, responsive listers.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let user: Awaited<ReturnType<typeof getSessionUser>> = null;
  try {
    user = await getSessionUser();
  } catch {
    // DB not configured — render nav in the logged-out state.
  }

  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <Link className="brand" href="/">Rabnix Estate</Link>
          <span className="tagline">Trust-first home search</span>
          <nav className="site-nav">
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/post">Post a property</Link>
            {user?.role === "admin" && <Link href="/admin/moderation">Moderation</Link>}
            {user ? (
              <>
                <span className="nav-user">{user.fullName ?? user.email ?? user.phone}</span>
                <LogoutButton />
              </>
            ) : (
              <Link href="/login">Sign in</Link>
            )}
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
