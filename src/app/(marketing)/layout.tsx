import type { Metadata } from "next";
import { siteUrl } from "@/lib/seo";
import "./marketing.css";

// Root layout for the v1 design (now the production frontend at "/"). Deliberately minimal —
// just <html>/<body>, matching rabnix-estate-v1 exactly so the ported components render
// identically: full Tailwind + preflight (marketing.css) and the default system sans stack
// (no forced web font). The legacy backend-wired pages live under the (site) route group with
// their own chrome + no-preflight stylesheet, so the two never collide.
const DESCRIPTION =
  "India's premier real estate platform — verified listings, zero brokerage, AI property valuation, and locality price trends.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: "Rabnix Estate — Buy, Rent & AI Property Valuation",
    template: "%s · Rabnix Estate",
  },
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: "Rabnix Estate",
    title: "Rabnix Estate — India Real Estate Platform",
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "Rabnix Estate",
    description: DESCRIPTION,
  },
};

export default function MarketingRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
