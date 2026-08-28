import { Suspense } from "react";
import { AuthForm } from "./AuthForm";
import { DevLoginPanel } from "./DevLoginPanel";

// Sign in / create account (email + password). OTP/SMS login is added later.
export default function LoginPage() {
  const isDev = process.env.NODE_ENV !== "production";
  return (
    <section>
      <h1>Sign in</h1>
      <p className="meta">Use your email and password. Phone OTP login is coming later.</p>
      <Suspense>
        <AuthForm />
        {isDev && <DevLoginPanel />}
      </Suspense>
    </section>
  );
}
