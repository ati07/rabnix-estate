import Link from "next/link";
import { LocalitySearch } from "./search/LocalitySearch";
import { BrowseSections } from "./BrowseSections";

// Landing + search entry. The search form GETs /search (which renders the synced map+list).
const city = process.env.NEXT_PUBLIC_DEFAULT_CITY ?? "your city";

export default function HomePage() {
  return (
    <section>
      <div className="hero">
        <h1>Find a home you can trust in {city}</h1>
        <p>Verified listings. Responsive owners &amp; agents. No broker spam.</p>

        <form className="searchbar" action="/search" method="get">
          <LocalitySearch placeholder={`Search locality in ${city} (e.g. Wakad, Baner)`} />
          <select name="intent" aria-label="Intent" defaultValue="">
            <option value="">Buy or Rent</option>
            <option value="sale">Buy</option>
            <option value="rent">Rent</option>
          </select>
          <select name="bhk" aria-label="BHK" defaultValue="">
            <option value="">Any BHK</option>
            <option value="1">1 BHK</option>
            <option value="2">2 BHK</option>
            <option value="3">3 BHK</option>
          </select>
          <button className="btn" type="submit">Search</button>
        </form>
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

      <BrowseSections cityName={city} showFresh />

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
