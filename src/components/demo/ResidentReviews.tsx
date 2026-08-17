import { demoResidentReviews, thumbGradient } from "@/modules/demo/dummy";

// DEMO ONLY — resident quotes for the area. Fabricated; swap for real reviews before launch.
export function ResidentReviews() {
  const initials = (name: string) => name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <section className="detail-section">
      <h2>What residents say</h2>
      <div className="resident-reviews">
        {demoResidentReviews.map((rv) => (
          <figure key={rv.id} className="resident-review">
            <figcaption>
              <span className="resident-avatar" style={{ backgroundImage: thumbGradient(rv.id + rv.name) }}>
                {initials(rv.name)}
              </span>
              <span>
                <strong>{rv.name}</strong>
                <span className="resident-tenure">{rv.tenure}</span>
              </span>
              <span className="resident-rating">★ {rv.rating.toFixed(1)}</span>
            </figcaption>
            <blockquote>{rv.text}</blockquote>
          </figure>
        ))}
      </div>
    </section>
  );
}
