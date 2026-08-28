// Indian-currency + EMI helpers, ported from rabnix-estate-v1 for the v1 design components.
// (Distinct from src/modules/search/format.ts `formatPriceShort`, which is the compact
// map-pin/card variant — this one produces the fuller "₹1.45 Cr" / "₹45,000" strings the
// v1 UI expects.) See docs/frontend-port-v1.md §4.

export function formatIndianCurrency(amount: number): string {
  if (!amount || isNaN(amount)) return '₹0';

  if (amount >= 10000000) {
    const cr = (amount / 10000000).toFixed(2).replace(/\.00$/, '');
    return `₹${cr} Cr`;
  }
  if (amount >= 100000) {
    const lac = (amount / 100000).toFixed(2).replace(/\.00$/, '');
    return `₹${lac} Lac`;
  }
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function formatIndianNumber(num: number): string {
  if (!num || isNaN(num)) return '0';
  return num.toLocaleString('en-IN');
}

export function calculateEmi(principal: number, annualRatePct: number, tenureYears: number): {
  monthlyEmi: number;
  totalInterest: number;
  totalPayment: number;
  principalPct: number;
  interestPct: number;
} {
  if (principal <= 0 || annualRatePct <= 0 || tenureYears <= 0) {
    return { monthlyEmi: 0, totalInterest: 0, totalPayment: 0, principalPct: 100, interestPct: 0 };
  }

  const monthlyRate = annualRatePct / (12 * 100);
  const totalMonths = tenureYears * 12;

  const emi =
    (principal * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
    (Math.pow(1 + monthlyRate, totalMonths) - 1);

  const totalPayment = emi * totalMonths;
  const totalInterest = totalPayment - principal;

  const principalPct = Math.round((principal / totalPayment) * 100);
  const interestPct = 100 - principalPct;

  return {
    monthlyEmi: Math.round(emi),
    totalInterest: Math.round(totalInterest),
    totalPayment: Math.round(totalPayment),
    principalPct,
    interestPct,
  };
}
