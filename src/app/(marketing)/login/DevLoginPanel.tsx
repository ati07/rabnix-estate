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
    <div className="mt-6 rounded-xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC] p-4">
      <p className="text-xs text-[#64748B]">
        <strong className="font-bold text-[#172033]">Dev quick login</strong> — no password, dev only
      </p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {ROLES.map(({ role, label }) => (
          <button
            key={role}
            type="button"
            className="rounded-lg border border-[#E2E8F0] bg-white py-2 text-xs font-bold text-[#172033] shadow-xs transition-colors hover:border-[#18A67D] hover:text-[#0E7C5D] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
            onClick={() => login(role)}
            disabled={busy !== null}
          >
            {busy === role ? "…" : label}
          </button>
        ))}
      </div>
      {error && <p className="mt-2 text-sm font-medium text-red-700">{error}</p>}
    </div>
  );
}
