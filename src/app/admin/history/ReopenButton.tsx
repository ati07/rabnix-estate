"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Reopen a moderated listing back to `pending` (undo a wrong approve/reject), then refresh.
export function ReopenButton({ listingId }: { listingId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function reopen() {
    if (!window.confirm("Reopen this listing for review (back to pending)?")) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/listings/${listingId}/reopen`, { method: "POST" });
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

  return (
    <div className="enquiry-foot" style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
      <button className="btn btn-sm btn-ghost" onClick={reopen} disabled={busy}>
        {busy ? "…" : "Reopen for review"}
      </button>
      {error && <span className="error">{error}</span>}
    </div>
  );
}
