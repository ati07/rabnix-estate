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

  const inputClass =
    "mt-1.5 w-full rounded-lg border border-[#E2E8F0] bg-white px-3.5 py-2.5 text-sm text-[#172033] placeholder:text-[#94A3B8] shadow-xs transition-colors focus:border-[#18A67D] focus:outline-none focus:ring-2 focus:ring-[#18A67D]/20";
  const labelClass = "block text-xs font-semibold uppercase tracking-wider text-[#64748B]";

  return (
    <div>
      <h1 className="text-xl font-extrabold tracking-tight text-[#0F2A43]">
        {mode === "login" ? "Welcome back" : "Create your account"}
      </h1>
      <p className="mt-1 text-sm text-[#64748B]">
        {mode === "login"
          ? "Sign in with your email and password."
          : "Join Rabnix Estate to save homes and post listings."}
      </p>

      {/* Tabs */}
      <div className="mt-5 grid grid-cols-2 gap-1 rounded-xl bg-[#F1F5F9] p-1">
        <button
          className={`rounded-lg py-2 text-sm font-bold transition-colors cursor-pointer ${
            mode === "login" ? "bg-white text-[#0E7C5D] shadow-xs" : "text-[#64748B] hover:text-[#172033]"
          }`}
          onClick={() => setMode("login")}
          type="button"
        >
          Sign in
        </button>
        <button
          className={`rounded-lg py-2 text-sm font-bold transition-colors cursor-pointer ${
            mode === "register" ? "bg-white text-[#0E7C5D] shadow-xs" : "text-[#64748B] hover:text-[#172033]"
          }`}
          onClick={() => setMode("register")}
          type="button"
        >
          Create account
        </button>
      </div>

      <form className="mt-5 space-y-4" onSubmit={onSubmit}>
        {mode === "register" && (
          <label className={labelClass}>
            Full name
            <input className={inputClass} name="fullName" type="text" autoComplete="name" placeholder="Your name" />
          </label>
        )}
        <label className={labelClass}>
          Email
          <input className={inputClass} name="email" type="email" autoComplete="email" required placeholder="you@example.com" />
        </label>
        <label className={labelClass}>
          Password
          <input
            className={inputClass}
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
            <label className={labelClass}>
              Phone (optional)
              <input className={inputClass} name="phone" type="tel" autoComplete="tel" placeholder="+91…" />
            </label>
            <label className={labelClass}>
              I want to
              <select className={inputClass} name="role" defaultValue="buyer">
                <option value="buyer">Find a home (buyer)</option>
                <option value="owner">List my property (owner)</option>
              </select>
            </label>
          </>
        )}

        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
            {error}
          </p>
        )}
        <button
          className="w-full rounded-lg bg-[#18A67D] py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-[#0E7C5D] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
          type="submit"
          disabled={busy}
        >
          {busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
        </button>
      </form>
    </div>
  );
}
