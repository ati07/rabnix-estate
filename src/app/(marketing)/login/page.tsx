import { Suspense } from "react";
import Link from "next/link";
import { AuthForm } from "./AuthForm";
import { DevLoginPanel } from "./DevLoginPanel";

// Sign in / create account (email + password). OTP/SMS login is added later.
// Lives in the (marketing) group so it wears the v1 design (Tailwind + system sans), matching /.
export default function LoginPage() {
  const isDev = process.env.NODE_ENV !== "production";
  return (
    <main className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center px-4 py-12 font-sans text-[#172033] selection:bg-[#18A67D] selection:text-white">
      {/* Brand */}
      <Link href="/" className="flex items-center gap-2 group select-none mb-8">
        <div className="w-9 h-9 bg-[#0F2A43] rounded-md flex items-center justify-center shadow-sm group-hover:bg-[#163b5c] transition-colors">
          <div className="w-4 h-4 border-2 border-[#18A67D] rotate-45 transition-transform group-hover:rotate-90 duration-300" />
        </div>
        <span className="text-2xl font-extrabold tracking-tight text-[#0F2A43]">
          Rabnix <span className="text-[#18A67D]">Estate</span>
        </span>
      </Link>

      {/* Card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-6 sm:p-8">
        <Suspense>
          <AuthForm />
          {isDev && <DevLoginPanel />}
        </Suspense>
      </div>

      <p className="mt-6 text-xs text-[#64748B] text-center max-w-md">
        Phone OTP login is coming later. By continuing you agree to Rabnix Estate&apos;s terms.
      </p>
    </main>
  );
}
