"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Admin controls for one user: suspend/unsuspend and grant/revoke admin. Disabled on your own row
// (the server also rejects self-actions). Mirrors ModerateButtons.
export function UserActions({
  userId,
  isSelf,
  isAdmin,
  isSuspended,
}: {
  userId: string;
  isSelf: boolean;
  isAdmin: boolean;
  isSuspended: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isSelf) return <span className="meta">(you)</span>;

  async function act(action: string, confirmMsg?: string) {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action }),
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

  return (
    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
      {isSuspended ? (
        <button className="btn btn-sm btn-ghost" onClick={() => act("unsuspend")} disabled={busy}>
          Unsuspend
        </button>
      ) : (
        <button
          className="btn btn-sm btn-danger"
          onClick={() => act("suspend", "Suspend this user? They'll be logged out and unable to act.")}
          disabled={busy}
        >
          Suspend
        </button>
      )}
      {isAdmin ? (
        <button
          className="btn btn-sm btn-ghost"
          onClick={() => act("demote", "Revoke admin from this user? Their role becomes buyer.")}
          disabled={busy}
        >
          Revoke admin
        </button>
      ) : (
        <button
          className="btn btn-sm btn-ghost"
          onClick={() => act("promote", "Grant admin to this user?")}
          disabled={busy}
        >
          Make admin
        </button>
      )}
      {error && <span className="error">{error}</span>}
    </div>
  );
}
