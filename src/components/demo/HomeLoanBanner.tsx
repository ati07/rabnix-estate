import Link from "next/link";
import { demoLoanBanks } from "@/modules/demo/dummy";

// DEMO ONLY — a home-loan offers strip like the portals run. Not a real product.
export function HomeLoanBanner() {
  return (
    <div className="loan-banner">
      <div className="loan-banner-text">
        <h2>Compare home loan offers from 15+ banks</h2>
        <p>Interest rates starting at 8.35%* — check eligibility in 2 minutes.</p>
        <Link className="btn" href="/search">Check eligibility</Link>
      </div>
      <div className="loan-banner-banks">
        {demoLoanBanks.map((b) => (
          <span key={b} className="loan-bank">{b}</span>
        ))}
      </div>
    </div>
  );
}
