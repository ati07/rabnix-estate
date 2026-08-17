import { prisma } from "@/lib/db";
import { PostListingForm } from "./PostListingForm";
import { PostFaq } from "./PostFaq";
import { ListingRail } from "@/components/ListingRail";
import { CityInsights } from "@/components/demo/CityInsights";
import { Testimonials } from "@/components/demo/Testimonials";

// Post-a-property page (supply side) — a MagicBricks-style marketing landing: a hero with the real
// posting form on the right, then how-it-works / benefits (static product copy) mixed with the same
// clearly-marked DEMO sections used on the homepage (rates, testimonials) + a REAL recently-posted
// rail and a static FAQ. Draft → publish happens in one submit; see build-plan Week 2.
const city = process.env.NEXT_PUBLIC_DEFAULT_CITY ?? "your city";

const STEPS: { icon: string; title: string; text: string }[] = [
  { icon: "📝", title: "Add property details", text: "Tell us the basics — type, location, price and configuration. Takes about two minutes." },
  { icon: "📸", title: "Upload real photos", text: "Add up to 12 clear photos. We strip location metadata and optimise them for you." },
  { icon: "🛡️", title: "Get verified & go live", text: "We moderate and duplicate-check every listing, then publish it to verified search." },
  { icon: "📞", title: "Receive genuine leads", text: "Buyers and tenants enquire directly. Respond in one click from your dashboard." },
];

const BENEFITS: { icon: string; title: string; text: string }[] = [
  { icon: "🆓", title: "100% free to list", text: "No brokerage, no listing fee, no hidden charges — ever." },
  { icon: "✅", title: "Verified-only marketplace", text: "Moderated, duplicate-checked listings buyers actually trust." },
  { icon: "🚫", title: "No broker spam", text: "Owner-direct enquiries only. No brokers pretending to be you." },
  { icon: "⚡", title: "Faster, genuine leads", text: "Reach buyers and tenants searching in your locality today." },
  { icon: "📊", title: "Response-rate tracking", text: "Reply quickly and your listing ranks higher in search." },
  { icon: "📍", title: "Map-based discovery", text: "Buyers find you on a live map and locality search." },
];

export default async function PostPage() {
  let localities: { id: string; name: string }[] = [];
  try {
    localities = await prisma.locality.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    });
  } catch {
    return (
      <div className="notice">
        Database not configured — set <code>DATABASE_URL</code> and run <code>npm run db:seed</code>.
      </div>
    );
  }

  return (
    <div className="post-page">
      <section className="post-hero">
        <div className="post-hero-copy">
          <span className="post-hero-badge">100% Free · 0% Brokerage</span>
          <h1>
            Post your property to <span className="post-hero-em">sell or rent</span> — for free
          </h1>
          <p>
            Reach genuine, verified buyers and tenants in {city}. No broker spam, faster enquiries,
            and better placement for listings you keep responsive.
          </p>
          <ul className="post-hero-points">
            <li>Advertise your property for free</li>
            <li>Get genuine, verified enquiries</li>
            <li>Moderated listings rank higher</li>
          </ul>
          <div className="post-hero-stats">
            <div>
              <strong>Free</strong>
              <span>to list</span>
            </div>
            <div>
              <strong>0%</strong>
              <span>brokerage</span>
            </div>
            <div>
              <strong>45 days</strong>
              <span>live per post</span>
            </div>
          </div>
        </div>

        <div className="post-hero-form" id="post-form">
          <div className="post-form-head">
            <h2>Start your free listing</h2>
            <p className="meta">Takes ~2 minutes · Verified listings get better placement.</p>
          </div>
          <PostListingForm localities={localities} />
        </div>
      </section>

      <section className="post-band">
        <h2 className="section-title">How it works</h2>
        <p className="section-sub">From listing to lead in four simple steps.</p>
        <ol className="how-steps">
          {STEPS.map((s, i) => (
            <li key={s.title} className="how-step">
              <span className="how-step-num">{i + 1}</span>
              <span className="how-step-icon">{s.icon}</span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="post-band post-band-tint">
        <h2 className="section-title">Why post on Rabnix Estate</h2>
        <p className="section-sub">A trust-first marketplace built for owners, not brokers.</p>
        <div className="benefit-grid">
          {BENEFITS.map((b) => (
            <div key={b.title} className="benefit-card">
              <span className="benefit-icon">{b.icon}</span>
              <h3>{b.title}</h3>
              <p>{b.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="post-band">
        <Testimonials />
      </section>

      <section className="post-band post-band-tint">
        <CityInsights cityName={city} />
      </section>

      <section className="post-band">
        <ListingRail
          title="Recently posted properties"
          subtitle={`The newest verified homes owners listed in ${city}`}
          sort="newest"
          badge="New"
        />
      </section>

      <section className="post-band post-band-tint">
        <PostFaq />
      </section>

      <section className="supply-cta">
        <h2 className="section-title">Ready to find your buyer or tenant?</h2>
        <p className="section-sub">List your property free and reach genuine, verified leads today.</p>
        <a className="btn" href="#post-form">Post your property free</a>
      </section>
    </div>
  );
}
