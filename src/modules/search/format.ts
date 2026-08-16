// Compact Indian-style money formatting for map pins / cards: K (thousand), L (lakh), Cr (crore).
export function formatPriceShort(value: number): string {
  if (!isFinite(value)) return "—";
  const abs = Math.abs(value);
  const trim = (n: number) => n.toFixed(n < 10 && !Number.isInteger(n) ? 1 : 0).replace(/\.0$/, "");
  if (abs >= 1e7) return `${trim(value / 1e7)}Cr`;
  if (abs >= 1e5) return `${trim(value / 1e5)}L`;
  if (abs >= 1e3) return `${trim(value / 1e3)}K`;
  return String(Math.round(value));
}
