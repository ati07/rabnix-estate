"use client";

import { useState } from "react";
import Link from "next/link";

// "Save this search" — persists the current filters as a SavedSearch so the buyer gets new-match
// counts on their dashboard (and alerts via the cron). Empty when there are no filters at all.
export function SaveSearchButton({
  query,
  isAuthed,
}: {
  query: Record<string, string>;
  isAuthed: boolean;
}) {
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  if (Object.keys(query).length === 0) return null;

  if (!isAuthed) {
    return (
      <Link className="btn btn-ghost btn-sm" href="/login">
        ☆ Save this search
      </Link>
    );
  }

  if (state === "saved") return <span className="save-search-done">★ Search saved</span>;

  async function save() {
    setState("saving");
    try {
      const res = await fetch("/api/saved-searches", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ query }),
      });
      setState(res.ok ? "saved" : "error");
    } catch {
      setState("error");
    }
  }

  return (
    <button className="btn btn-ghost btn-sm" onClick={save} disabled={state === "saving"}>
      {state === "error" ? "Couldn't save — retry" : state === "saving" ? "Saving…" : "☆ Save this search"}
    </button>
  );
}
