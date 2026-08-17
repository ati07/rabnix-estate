import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { getSessionUser } from "@/lib/auth";
import { siteUrl } from "@/lib/seo";
import { LogoutButton } from "./LogoutButton";

const DESCRIPTION =
  "The most trusted place to find a home. Verified listings, responsive listers.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: "Rabnix Estate — Trusted homes", template: "%s · Rabnix Estate" },
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: "Rabnix Estate",
    title: "Rabnix Estate — Trusted homes",
    description: DESCRIPTION,
  },
  twitter: { card: "summary_large_image", title: "Rabnix Estate", description: DESCRIPTION },
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
            {user?.role === "admin" && <Link href="/admin">Admin</Link>}
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
