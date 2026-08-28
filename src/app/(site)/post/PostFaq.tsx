// Static FAQ for the post-a-property page. Real product copy (accurate to our flow) — not demo data.
// Native <details> so it works without JS and stays a server component.
const FAQS: { q: string; a: string }[] = [
  {
    q: "Is posting a property really free?",
    a: "Yes. Listing to sell or rent on Rabnix Estate is 100% free, with no brokerage and no hidden charges. You only ever deal with genuine buyers and tenants — never a broker pretending to be the owner.",
  },
  {
    q: "Why does my listing need approval before it goes live?",
    a: "Every listing is moderated and duplicate-checked before it appears in search. This keeps the marketplace verified and spam-free, which is exactly why buyers trust it — and why a moderated listing reaches more genuine leads.",
  },
  {
    q: "How long does my listing stay live?",
    a: "A published listing stays live for 45 days. You can renew, edit or take it down anytime from your dashboard, and we track your response rate so responsive owners rank higher.",
  },
  {
    q: "How do buyers and tenants contact me?",
    a: "Interested buyers send an enquiry from your listing and can reveal your phone number to call directly. You'll see every enquiry on your dashboard and can respond in one click.",
  },
  {
    q: "What photos should I upload?",
    a: "Add up to 12 clear photos (JPEG, PNG or WebP). We automatically strip location metadata and optimise each image. Listings with real, complete photos get better placement and far more enquiries.",
  },
  {
    q: "Can I edit or remove my listing later?",
    a: "Yes. Manage everything — edit details, pause, renew or delete — from your dashboard. Removed listings disappear from search immediately.",
  },
];

export function PostFaq() {
  return (
    <div>
      <h2 className="section-title">Frequently asked questions</h2>
      <p className="section-sub">Everything owners ask before posting their first property.</p>
      <div className="faq-list">
        {FAQS.map((f) => (
          <details key={f.q} className="faq-item">
            <summary>{f.q}</summary>
            <p>{f.a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
