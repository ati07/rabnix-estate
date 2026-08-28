"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Mode = "login" | "register";

// Toggles between sign-in and create-account. On success, redirects to ?redirect= (default /).
export function AuthForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get("redirect") || "/";
  const [mode, setMode] = useState<Mode>(params.get("mode") === "register" ? "register" : "login");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const payload = Object.fromEntries(form.entries());
    const url = mode === "login" ? "/api/auth/login" : "/api/auth/register";
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body?.error?.message ?? "Something went wrong");
        return;
      }
      router.push(redirect);
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ maxWidth: 560 }}>
      <div className="tabs">
        <button className={`tab ${mode === "login" ? "active" : ""}`} onClick={() => setMode("login")} type="button">
          Sign in
        </button>
        <button
          className={`tab ${mode === "register" ? "active" : ""}`}
          onClick={() => setMode("register")}
          type="button"
        >
          Create account
        </button>
      </div>

      <form className="form" onSubmit={onSubmit}>
        {mode === "register" && (
          <label>
            Full name
            <input name="fullName" type="text" autoComplete="name" placeholder="Your name" />
          </label>
        )}
        <label>
          Email
          <input name="email" type="email" autoComplete="email" required placeholder="you@example.com" />
        </label>
        <label>
          Password
          <input
            name="password"
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            required
            minLength={mode === "register" ? 8 : undefined}
            placeholder={mode === "register" ? "At least 8 characters" : "Your password"}
          />
        </label>

        {mode === "register" && (
          <>
            <label>
              Phone (optional)
              <input name="phone" type="tel" autoComplete="tel" placeholder="+91…" />
            </label>
            <label>
              I want to
              <select name="role" defaultValue="buyer">
                <option value="buyer">Find a home (buyer)</option>
                <option value="owner">List my property (owner)</option>
              </select>
            </label>
          </>
        )}

        {error && <p className="error">{error}</p>}
        <button className="btn" type="submit" disabled={busy}>
          {busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
        </button>
      </form>
    </div>
  );
}
