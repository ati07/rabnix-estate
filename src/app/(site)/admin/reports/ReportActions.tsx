"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Admin actions on a reported listing: take it down (→ rejected, resolves its reports) or dismiss
// the reports as noise (listing untouched). Mirrors ModerateButtons.
export function ReportActions({ listingId }: { listingId: string }) {
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

  function takedown() {
    const reason = window.prompt("Reason for taking this listing down (shown to the owner):");
    if (reason == null) return;
    if (!reason.trim()) {
      setError("A reason is required");
      return;
    }
    act("takedown", { reason: reason.trim() });
  }

  return (
    <div className="enquiry-foot" style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
      <button className="btn btn-sm btn-danger" onClick={takedown} disabled={busy}>
        {busy ? "…" : "Take down"}
      </button>
      <button className="btn btn-sm btn-ghost" onClick={() => act("dismiss-reports")} disabled={busy}>
        Dismiss reports
      </button>
      {error && <span className="error">{error}</span>}
    </div>
  );
}
