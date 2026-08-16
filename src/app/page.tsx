// Landing + search entry. The search form GETs /api/listings/search.
// This is a deliberately minimal server component; the mobile-first map+list results
// UI (bottom-sheet filters, synced map) is Week 3 work — see docs/build-plan-phase1.md.

const city = process.env.NEXT_PUBLIC_DEFAULT_CITY ?? "your city";

export default function HomePage() {
  return (
    <section>
      <div className="hero">
        <h1>Find a home you can trust in {city}</h1>
        <p>Verified listings. Responsive owners &amp; agents. No broker spam.</p>
      </div>

      <form className="searchbar" action="/api/listings/search" method="get">
        <input name="locality" placeholder={`Search locality in ${city} (e.g. Wakad, Baner)`} aria-label="Locality" />
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

      <div className="notice">
        <strong>Scaffold note:</strong> results, listing detail, posting, and OTP contact are wired as
        API routes but need a configured <code>DATABASE_URL</code> (Postgres + PostGIS) and{" "}
        <code>npm run db:push &amp;&amp; npm run db:seed</code>. See <code>docs/build-plan-phase1.md</code>.
      </div>
    </section>
  );
}
