import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { getSessionUser } from "@/lib/auth";
import { siteUrl } from "@/lib/seo";
import { LogoutButton } from "./LogoutButton";

// Brand typeface — loaded/self-hosted by next/font; exposed as --font-sans for globals.css.
const dmSans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

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
    <html lang="en" className={dmSans.variable}>
      <body>
        <header className="site-header">
          <Link className="brand" href="/">
            <span className="brand-mark">R</span>
            <span className="brand-name">Rabnix Estate</span>
          </Link>
          <nav className="primary-nav">
            <Link href="/search?intent=sale">Buy</Link>
            <Link href="/search?intent=rent">Rent</Link>
            <Link href="/post">Sell</Link>
            <Link href="/search">Explore</Link>
          </nav>
          <div className="nav-actions">
            <Link className="nav-link" href="/dashboard">♡ Saved</Link>
            {user?.role === "admin" && <Link className="nav-link" href="/admin">Admin</Link>}
            {user ? (
              <>
                <span className="nav-user">{user.fullName ?? user.email ?? user.phone}</span>
                <LogoutButton />
              </>
            ) : (
              <Link className="nav-link" href="/login">Sign in</Link>
            )}
            <Link className="nav-cta" href="/post">Post Property</Link>
          </div>
        </header>
        <main className="container">{children}</main>
        <footer className="site-footer">
          <span>MVP scaffold · see <code>/docs</code></span>
        </footer>
      </body>
    </html>
  );
}
