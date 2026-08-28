import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import Link from "next/link";
import "../globals.css";
import { getSessionUser } from "@/lib/auth";
import { siteUrl } from "@/lib/seo";
import { LogoutButton } from "../LogoutButton";

// Root layout for the legacy backend-wired pages (search, post, login, dashboard, admin, listings).
// Keeps the original chrome (mega-menu header + width-capped container + footer) and the legacy
// no-preflight stylesheet (../globals.css). Isolated from the (marketing) root layout so the v1
// design's Tailwind preflight never resets these pages, and vice-versa.
const dmSans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

const DESCRIPTION =
  "The most trusted place to find a home. Verified listings, responsive listers.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: "Rabnix Estate — Trusted homes",
    template: "%s · Rabnix Estate",
  },
  description: DESCRIPTION,
};

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let user: Awaited<ReturnType<typeof getSessionUser>> = null;

  try {
    user = await getSessionUser();
  } catch {
    // DB not configured — render nav in logged-out state.
  }

  return (
    <html lang="en" className={dmSans.variable}>
      <body>
        <header className="site-header">
          {/* =========================
              BRAND
              ========================= */}
          <Link className="brand" href="/">
            <span className="brand-mark">R</span>
            <span className="brand-name">Rabnix Estate</span>
          </Link>

          {/* =========================
              PRIMARY NAVIGATION
              ========================= */}
          <nav className="primary-nav">
            {/* =========================
                BUY
                ========================= */}
            <div className="nav-dropdown">
              <Link
                href="/search?intent=sale"
                className="nav-dropdown-trigger"
              >
                Buy
                {/* <span className="chevron">⌄</span> */}
              </Link>

              <div className="mega-menu">
                {/* Popular Choices */}
                <div className="mega-column">
                  <h4>Popular Choices</h4>

                  <Link href="/search?intent=sale&ready=true">
                    Ready to Move
                  </Link>

                  <Link href="/search?intent=sale&owner=true">
                    Owner Properties
                  </Link>

                  <Link href="/search?intent=sale&budget=budget">
                    Budget Homes
                  </Link>

                  <Link href="/search?intent=sale&premium=true">
                    Premium Homes
                  </Link>

                  <Link href="/projects">New Projects</Link>
                </div>

                {/* Property Types */}
                <div className="mega-column">
                  <h4>Property Types</h4>

                  <Link href="/search?intent=sale&type=apartment">
                    Flats
                  </Link>

                  <Link href="/search?intent=sale&type=house">
                    House
                  </Link>

                  <Link href="/search?intent=sale&type=villa">
                    Villa
                  </Link>

                  <Link href="/search?intent=sale&type=plot">
                    Plot
                  </Link>

                  <Link href="/search?intent=sale&type=commercial">
                    Commercial
                  </Link>
                </div>

                {/* Budget */}
                <div className="mega-column">
                  <h4>Budget</h4>

                  <Link href="/search?intent=sale&maxPrice=5000000">
                    Under ₹50 Lac
                  </Link>

                  <Link
                    href="/search?intent=sale&minPrice=5000000&maxPrice=10000000"
                  >
                    ₹50 Lac – ₹1 Cr
                  </Link>

                  <Link
                    href="/search?intent=sale&minPrice=10000000&maxPrice=15000000"
                  >
                    ₹1 Cr – ₹1.5 Cr
                  </Link>

                  <Link href="/search?intent=sale&minPrice=15000000">
                    Above ₹1.5 Cr
                  </Link>
                </div>

                {/* Explore */}
                <div className="mega-column">
                  <h4>Explore</h4>

                  <Link href="/search?intent=sale">
                    All Properties
                  </Link>

                  <Link href="/localities">
                    Popular Localities
                  </Link>

                  <Link href="/projects">Projects</Link>

                  <Link href="/agents">Find an Agent</Link>
                </div>
              </div>
            </div>

            {/* =========================
                RENT
                ========================= */}
            <div className="nav-dropdown">
              <Link
                href="/search?intent=rent"
                className="nav-dropdown-trigger"
              >
                Rent
                {/* <span className="chevron">⌄</span> */}
              </Link>

              <div className="mega-menu rent-menu">
                {/* Popular Choices */}
                <div className="mega-column">
                  <h4>Popular Choices</h4>

                  <Link href="/search?intent=rent">
                    All Rental Properties
                  </Link>

                  <Link href="/search?intent=rent&type=apartment">
                    Apartments
                  </Link>

                  <Link href="/search?intent=rent&type=house">
                    Independent Houses
                  </Link>

                  <Link href="/search?intent=rent&type=villa">
                    Villas
                  </Link>
                </div>

                {/* Bedrooms */}
                <div className="mega-column">
                  <h4>Bedrooms</h4>

                  <Link href="/search?intent=rent&bedrooms=1">
                    1 BHK
                  </Link>

                  <Link href="/search?intent=rent&bedrooms=2">
                    2 BHK
                  </Link>

                  <Link href="/search?intent=rent&bedrooms=3">
                    3 BHK
                  </Link>

                  <Link href="/search?intent=rent&bedrooms=4">
                    4+ BHK
                  </Link>
                </div>

                {/* Explore */}
                <div className="mega-column">
                  <h4>Explore</h4>

                  <Link href="/search?intent=rent&furnished=true">
                    Furnished Homes
                  </Link>

                  <Link href="/search?intent=rent&verified=true">
                    Verified Properties
                  </Link>

                  <Link href="/localities">
                    Popular Localities
                  </Link>

                  <Link href="/agents">
                    Find an Agent
                  </Link>
                </div>
              </div>
            </div>

            {/* =========================
                SELL
                ========================= */}
            <Link href="/post" className="nav-simple-link">
              Sell
            </Link>

            {/* =========================
                EXPLORE
                ========================= */}
            <div className="nav-dropdown">
              <Link href="/search" className="nav-dropdown-trigger">
                Explore
                {/* <span className="chevron">⌄</span> */}
              </Link>

              <div className="small-menu">
                <Link href="/localities">
                  Popular Localities
                </Link>

                <Link href="/projects">
                  New Projects
                </Link>

                <Link href="/agents">
                  Find an Agent
                </Link>

                <Link href="/search">
                  All Properties
                </Link>

                <Link href="/about">
                  About Rabnix Estate
                </Link>
              </div>
            </div>
          </nav>

          {/* =========================
              RIGHT SIDE ACTIONS
              ========================= */}
          <div className="nav-actions">
            <Link className="nav-link" href="/dashboard">
              ♡ Saved
            </Link>

            {user?.role === "admin" && (
              <Link className="nav-link" href="/admin">
                Admin
              </Link>
            )}

            {user ? (
              <>
                <span className="nav-user">
                  {user.fullName ?? user.email ?? user.phone}
                </span>

                <LogoutButton />
              </>
            ) : (
              <Link className="nav-link" href="/login">
                Sign in
              </Link>
            )}

            <Link className="nav-cta" href="/post">
              Post Property
            </Link>
          </div>
        </header>

        <main className="container">{children}</main>

        <footer className="site-footer">
          <span>
            MVP scaffold · see <code>/docs</code>
          </span>
        </footer>
      </body>
    </html>
  );
}
