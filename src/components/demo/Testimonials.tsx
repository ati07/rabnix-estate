import { demoTestimonials, thumbGradient } from "@/modules/demo/dummy";

// DEMO ONLY — social-proof quotes. Fabricated; swap for real reviews before launch.
export function Testimonials() {
  const initials = (name: string) => name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div>
      <h2 className="section-title">Loved by buyers &amp; owners</h2>
      <p className="section-sub">Why people choose a trust-first search.</p>
      <div className="testimonial-grid">
        {demoTestimonials.map((t) => (
          <figure key={t.id} className="testimonial">
            <blockquote>“{t.quote}”</blockquote>
            <figcaption>
              <span className="testimonial-avatar" style={{ backgroundImage: thumbGradient(t.id + t.name) }}>
                {initials(t.name)}
              </span>
              <span>
                <strong>{t.name}</strong>
                <span className="testimonial-role">{t.role}</span>
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
