"use client";

import { useState } from "react";
import Link from "next/link";

const REASONS: { value: string; label: string }[] = [
  { value: "spam", label: "Spam / broker spam" },
  { value: "fraud", label: "Looks fake / fraud" },
  { value: "duplicate", label: "Duplicate listing" },
  { value: "offensive", label: "Offensive content" },
  { value: "wrong_info", label: "Wrong information" },
  { value: "other", label: "Other" },
];

// Report a listing for abuse. Feeds the moderation risk score. Auth-gated (a login link when
// signed out); collapses to a short reason form and confirms on submit.
export function ReportButton({ listingId, isAuthed }: { listingId: string; isAuthed: boolean }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("spam");
  const [detail, setDetail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  if (!isAuthed) {
    return (
      <Link className="btn btn-sm btn-ghost" href={`/login?redirect=/listings/${listingId}`}>
        ⚑ Report
      </Link>
    );
  }

  if (done) return <span className="report-done">⚑ Reported — thank you</span>;

  if (!open) {
    return (
      <button type="button" className="btn btn-sm btn-ghost" onClick={() => setOpen(true)}>
        ⚑ Report
      </button>
    );
  }

  async function submit() {
    setBusy(true);
    try {
      const res = await fetch(`/api/listings/${listingId}/report`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reason, detail: detail.trim() || undefined }),
      });
      if (res.ok) setDone(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="report-form">
      <select value={reason} onChange={(e) => setReason(e.target.value)} aria-label="Report reason">
        {REASONS.map((r) => (
          <option key={r.value} value={r.value}>{r.label}</option>
        ))}
      </select>
      <input
        type="text"
        placeholder="Details (optional)"
        value={detail}
        maxLength={1000}
        onChange={(e) => setDetail(e.target.value)}
      />
      <button type="button" className="btn btn-sm" onClick={submit} disabled={busy}>
        {busy ? "Sending…" : "Submit"}
      </button>
      <button type="button" className="btn btn-sm btn-ghost" onClick={() => setOpen(false)} disabled={busy}>
        Cancel
      </button>
    </div>
  );
}
