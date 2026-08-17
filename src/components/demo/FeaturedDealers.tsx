import { demoAgents, thumbGradient } from "@/modules/demo/dummy";

// DEMO ONLY — a "featured dealers" row (99acres pattern). Fabricated agents; not wired to any real
// dealer directory. Reuses the landing page's demo agent list.
export function FeaturedDealers({ cityName }: { cityName: string }) {
  const initials = (name: string) => name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const dealers = demoAgents(cityName).slice(0, 4);
  return (
    <section className="detail-section">
      <h2>Reach out to featured dealers</h2>
      <div className="dealer-row">
        {dealers.map((d) => (
          <div key={d.id} className="dealer-card">
            <span className="dealer-avatar" style={{ backgroundImage: thumbGradient(d.id + d.name) }}>
              {initials(d.name)}
            </span>
            <div className="dealer-body">
              <span className="dealer-name">{d.name}</span>
              <span className="dealer-agency">{d.agency}</span>
              <span className="dealer-meta">⭐ {d.rating} · {d.deals} deals</span>
            </div>
            <span className="dealer-cta">Contact</span>
          </div>
        ))}
      </div>
    </section>
  );
}
