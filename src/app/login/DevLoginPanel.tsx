"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Role = "admin" | "owner" | "buyer";
const ROLES: { role: Role; label: string }[] = [
  { role: "admin", label: "Admin" },
  { role: "owner", label: "Owner" },
  { role: "buyer", label: "Buyer" },
];

// DEV-ONLY quick login — one click per role, hitting /api/dev/login (which 404s in production).
// Skips email/password so moderator/owner/buyer flows are testable instantly. Rendered only in
// non-production by the login page.
export function DevLoginPanel() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get("redirect") || "/";
  const [busy, setBusy] = useState<Role | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function login(role: Role) {
    setBusy(role);
    setError(null);
    try {
      const res = await fetch("/api/dev/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body?.error?.message ?? "Dev login failed");
        return;
      }
      router.push(role === "admin" ? "/admin/moderation" : redirect);
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="dev-panel">
      <p className="meta" style={{ margin: 0 }}>
        <strong>Dev quick login</strong> — no password, dev only
      </p>
      <div className="dev-panel-buttons">
        {ROLES.map(({ role, label }) => (
          <button
            key={role}
            type="button"
            className="btn btn-sm"
            onClick={() => login(role)}
            disabled={busy !== null}
          >
            {busy === role ? "…" : label}
          </button>
        ))}
      </div>
      {error && <p className="error" style={{ margin: 0 }}>{error}</p>}
    </div>
  );
}
