"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Contact reveal: posts an enquiry then shows the lister's phone. Requires a session —
// if none, we prompt the visitor to sign in (email + password; OTP added later).
export function ContactButton({ listingId }: { listingId: string }) {
  const pathname = usePathname();
  const [phone, setPhone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [needLogin, setNeedLogin] = useState(false);
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
        setNeedLogin(true);
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
      {needLogin && (
        <p className="meta">
          <Link href={`/login?redirect=${encodeURIComponent(pathname)}`}>Sign in</Link> to see contact details.
        </p>
      )}
      {error && <p className="meta">{error}</p>}
    </div>
  );
}
