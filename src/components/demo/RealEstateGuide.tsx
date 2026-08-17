import { Rail } from "../Rail";
import { demoArticles, thumbGradient } from "@/modules/demo/dummy";

// DEMO ONLY — an editorial "guide/advice" rail. No CMS behind it; cards are inert.
export function RealEstateGuide() {
  return (
    <Rail title="Your real estate guide" subtitle="Advice, finance and legal, in plain language">
      {demoArticles.map((a) => (
        <div key={a.id} className="article-card">
          <div className="article-thumb" style={{ backgroundImage: thumbGradient(a.id + a.title) }}>
            <span className="article-cat">{a.category}</span>
          </div>
          <div className="article-body">
            <h3>{a.title}</h3>
            <span className="article-read">{a.readMins} min read</span>
          </div>
        </div>
      ))}
    </Rail>
  );
}
