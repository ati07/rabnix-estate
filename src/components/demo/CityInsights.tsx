import { demoInsights, demoRates } from "@/modules/demo/dummy";

// DEMO ONLY — a "city snapshot" stats strip + locality price table. Numbers are fabricated (we have
// no price-history pipeline). Structural stand-in for the portals' market-insight blocks.
export function CityInsights({ cityName }: { cityName: string }) {
  const stats = demoInsights(cityName);
  const rates = demoRates(cityName);
  return (
    <div className="insights">
      <h2 className="section-title">{cityName} property snapshot</h2>
      <p className="section-sub">Indicative market trends to help you gauge fair prices.</p>

      <div className="stat-grid">
        {stats.map((s) => (
          <div key={s.label} className="stat">
            <span className="num">{s.value}</span>
            <span className="label">{s.label}</span>
            <span className="stat-trend">{s.sub}</span>
          </div>
        ))}
      </div>

      <div className="rates-table">
        <div className="rates-row rates-head">
          <span>Locality</span>
          <span>Avg. price / sqft</span>
          <span>YoY</span>
        </div>
        {rates.map((r) => (
          <div key={r.locality} className="rates-row">
            <span>{r.locality}</span>
            <span>{r.rate}</span>
            <span className="rates-trend">{r.trend}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
