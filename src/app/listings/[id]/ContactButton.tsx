"use client";

import { useState } from "react";

// Contact reveal: posts an enquiry then shows the lister's phone. In production this is
// OTP-gated (login required); locally use POST /api/dev/login first to get a session.
export function ContactButton({ listingId }: { listingId: string }) {
  const [phone, setPhone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function contact() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/listings/${listingId}/contact`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ channel: "call" }),
      });
      if (res.ok) {
        const data = (await res.json()) as { phone: string };
        setPhone(data.phone);
      } else if (res.status === 401) {
        setError("Log in to see contact details (dev: POST /api/dev/login).");
      } else {
        setError("Could not fetch contact details.");
      }
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }

  if (phone) return <p className="price">📞 {phone}</p>;

  return (
    <div>
      <button className="btn" onClick={contact} disabled={loading}>
        {loading ? "…" : "Contact lister"}
      </button>
      {error && <p className="meta">{error}</p>}
    </div>
  );
}
