"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Marks an enquiry as responded (sets listerRespondedAt server-side), then refreshes the SSR view.
export function RespondButton({ enquiryId }: { enquiryId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function respond() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/enquiries/${enquiryId}/respond`, { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body?.error?.message ?? "Could not mark as responded");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <span>
      <button className="btn btn-sm" onClick={respond} disabled={busy}>
        {busy ? "Saving…" : "Mark responded"}
      </button>
      {error && <span className="error" style={{ marginLeft: "0.5rem" }}>{error}</span>}
    </span>
  );
}
