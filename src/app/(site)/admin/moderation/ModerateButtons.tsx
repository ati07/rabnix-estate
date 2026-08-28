"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Admin approve / reject controls for one pending listing. POSTs to the admin routes,
// then refreshes the SSR queue. Reject prompts for a reason (sent to the owner).
export function ModerateButtons({ listingId }: { listingId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function act(path: string, body?: unknown) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/listings/${listingId}/${path}`, {
        method: "POST",
        ...(body ? { headers: { "content-type": "application/json" }, body: JSON.stringify(body) } : {}),
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        setError(b?.error?.message ?? "Action failed");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  }

  function reject() {
    const reason = window.prompt("Reason for rejecting this listing (shown to the owner):");
    if (reason == null) return; // cancelled
    if (!reason.trim()) {
      setError("A reason is required to reject");
      return;
    }
    act("reject", { reason: reason.trim() });
  }

  return (
    <div className="enquiry-foot" style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
      <button className="btn btn-sm" onClick={() => act("approve")} disabled={busy}>
        {busy ? "…" : "Approve"}
      </button>
      <button className="btn btn-sm btn-danger" onClick={reject} disabled={busy}>
        Reject
      </button>
      {error && <span className="error">{error}</span>}
    </div>
  );
}
