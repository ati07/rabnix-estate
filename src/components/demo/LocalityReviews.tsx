import { demoLocalityReview } from "@/modules/demo/dummy";

// DEMO ONLY — a locality rating panel (overall score + category bars). Fabricated; we have no
// resident-survey pipeline yet. Mirrors the 99acres "Locality Reviews" block.
export function LocalityReviews({ localityName, seed }: { localityName: string; seed: string }) {
  const r = demoLocalityReview(seed);
  const stars = "★★★★★".slice(0, Math.round(r.rating)).padEnd(5, "☆");
  return (
    <section className="detail-section">
      <h2>Ratings &amp; reviews for {localityName}</h2>
      <div className="loc-review">
        <div className="loc-review-score">
          <span className="loc-review-num">{r.rating.toFixed(1)}</span>
          <span className="loc-review-stars">{stars}</span>
          <span className="loc-review-count">{r.count} ratings</span>
        </div>
        <div className="loc-review-bars">
          {r.bars.map((b) => (
            <div key={b.label} className="loc-bar">
              <span className="loc-bar-label">{b.label}</span>
              <span className="loc-bar-track">
                <span className="loc-bar-fill" style={{ width: `${(b.score / 5) * 100}%` }} />
              </span>
              <span className="loc-bar-score">{b.score.toFixed(1)}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
