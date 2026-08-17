import { demoAgents, thumbGradient } from "@/modules/demo/dummy";

// DEMO ONLY — a "preferred agents" row. We don't model agents; this is portal-style filler.
export function TopAgents({ cityName }: { cityName: string }) {
  const agents = demoAgents(cityName);
  const initials = (name: string) =>
    name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div>
      <h2 className="section-title">Preferred agents in {cityName}</h2>
      <p className="section-sub">Top-rated professionals with a track record of closed deals.</p>
      <div className="agent-grid">
        {agents.map((a) => (
          <div key={a.id} className="agent-card">
            <span className="agent-avatar" style={{ backgroundImage: thumbGradient(a.id + a.name) }}>
              {initials(a.name)}
            </span>
            <div className="agent-name">{a.name}</div>
            <div className="agent-agency">{a.agency}</div>
            <div className="agent-meta">
              ⭐ {a.rating.toFixed(1)} · {a.deals} deals
            </div>
            <div className="agent-loc">{a.locality}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
