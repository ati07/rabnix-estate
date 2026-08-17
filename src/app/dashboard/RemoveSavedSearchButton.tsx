"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Remove a saved search, then refresh the dashboard. Mirrors RespondButton's optimistic pattern.
export function RemoveSavedSearchButton({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function remove() {
    setBusy(true);
    try {
      await fetch(`/api/saved-searches/${id}`, { method: "DELETE" });
      router.refresh();
    } catch {
      setBusy(false);
    }
  }

  return (
    <button className="btn btn-ghost btn-sm" onClick={remove} disabled={busy}>
      {busy ? "Removing…" : "Remove"}
    </button>
  );
}
