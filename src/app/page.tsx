import Link from "next/link";
import { HeroSearch } from "./HeroSearch";
import { BrowseSections } from "./BrowseSections";
import { ListingRail } from "@/components/ListingRail";
import { TopLocalities } from "@/components/TopLocalities";
import { FeaturedProjects } from "@/components/demo/FeaturedProjects";
import { HomeLoanBanner } from "@/components/demo/HomeLoanBanner";
import { CityInsights } from "@/components/demo/CityInsights";
import { TopAgents } from "@/components/demo/TopAgents";
import { RealEstateGuide } from "@/components/demo/RealEstateGuide";
import { Testimonials } from "@/components/demo/Testimonials";

// Landing + search entry. The search form GETs /search (which renders the synced map+list).
// Below the hero, a portal-style stack of alternating bands — real inventory carousels + browse
// chips mixed with clearly-marked DEMO sections (projects, agents, insights, guide, testimonials)
// so the page reads "full" like MagicBricks/99acres. See src/modules/demo/dummy.ts to strip demo.
const city = process.env.NEXT_PUBLIC_DEFAULT_CITY ?? "your city";

export default function HomePage() {
  return (
    <section>
      <div className="hero">
        <div className="hero-copy">
          <h1>
            Find your perfect
            <br />
            place to call <span className="hero-em">home</span>
          </h1>
          <p>
            Explore verified properties for sale, rent and investment across {city}&apos;s
            top locations.
          </p>

          <HeroSearch city={city} />

          <div className="hero-popular">
            <span>Popular searches:</span>
            <Link href="/search?intent=sale">Buy</Link>
            <Link href="/search?intent=rent">Rent</Link>
            <Link href="/search?type=apartment">Apartments</Link>
            <Link href="/search?type=villa">Villas</Link>
            <Link href="/search?bhk=2">2 BHK</Link>
            <Link href="/search?bhk=3">3 BHK</Link>
          </div>
        </div>
      </div>

      <div className="trust-strip">
        <div className="trust-card">
          <div className="ico">✅</div>
          <h3>Verified inventory</h3>
          <p>Every listing is moderated and duplicate-checked before it goes live.</p>
        </div>
        <div className="trust-card">
          <div className="ico">⚡</div>
          <h3>Responsive listers</h3>
          <p>We track response rates so you reach owners who actually reply.</p>
        </div>
        <div className="trust-card">
          <div className="ico">🛡️</div>
          <h3>Report &amp; risk scoring</h3>
          <p>Buyers flag bad listings; our risk engine surfaces them for review.</p>
        </div>
      </div>

      <div className="band">
        <ListingRail
          title="Featured Properties"
          subtitle={`Handpicked verified homes in ${city}`}
          sort="newest"
          badge="Verified"
        />
      </div>

      <div className="band band-tint">
        <TopLocalities cityName={city} />
      </div>

      <div className="band">
        <FeaturedProjects cityName={city} />
      </div>

      <div className="band">
        <HomeLoanBanner />
      </div>

      <div className="band band-tint">
        <ListingRail
          title={`Handpicked homes in ${city}`}
          subtitle="Top-quality listings, sorted by completeness & trust"
          sort="relevance"
          badge="Verified"
        />
      </div>

      <div className="band">
        <CityInsights cityName={city} />
      </div>

      <div className="band band-tint">
        <BrowseSections cityName={city} />
      </div>

      <div className="band">
        <TopAgents cityName={city} />
      </div>

      <div className="band band-tint">
        <RealEstateGuide />
      </div>

      <div className="band">
        <Testimonials />
      </div>

      <div className="supply-cta">
        <h2 className="section-title">Own a property?</h2>
        <p className="section-sub">
          List it free and reach genuine buyers — no broker spam, faster enquiries.
        </p>
        <Link className="btn" href="/post">Post your property</Link>
      </div>
    </section>
  );
}
