"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Save / unsave a listing. Optimistic toggle backed by /api/listings/:id/favorite.
// Unauthenticated visitors get a login link (save is a buyer action).
export function FavoriteButton({
  listingId,
  initialSaved,
  isAuthed,
}: {
  listingId: string;
  initialSaved: boolean;
  isAuthed: boolean;
}) {
  const router = useRouter();
  const [saved, setSaved] = useState(initialSaved);
  const [busy, setBusy] = useState(false);

  if (!isAuthed) {
    return (
      <Link className="btn btn-sm btn-ghost" href={`/login?redirect=/listings/${listingId}`}>
        ♡ Save
      </Link>
    );
  }

  async function toggle() {
    setBusy(true);
    const next = !saved;
    setSaved(next); // optimistic
    try {
      const res = await fetch(`/api/listings/${listingId}/favorite`, {
        method: next ? "POST" : "DELETE",
      });
      if (!res.ok) {
        setSaved(!next); // revert
      } else {
        router.refresh(); // keep the dashboard "Saved" list in sync
      }
    } catch {
      setSaved(!next);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      className={`btn btn-sm ${saved ? "" : "btn-ghost"}`}
      onClick={toggle}
      disabled={busy}
      aria-pressed={saved}
    >
      {saved ? "♥ Saved" : "♡ Save"}
    </button>
  );
}
