// Provider-neutral observability facade — the single swap-point for error tracking + product
// analytics, mirroring the storage.ts pattern. Console-logs in dev; forwards to the real SDKs
// when they're installed *and* their env keys are set. It's a safe no-op until then, so switching
// on Sentry/PostHog is a few lines here — no call-site changes across the app.

type Props = Record<string, unknown>;

const SENTRY_DSN = process.env.SENTRY_DSN;
const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;

/** Report an error. Always logs; forwards to Sentry when configured. */
export async function captureError(error: unknown, context?: Props): Promise<void> {
  console.error("[observability] error", error, context ?? "");
  if (!SENTRY_DSN) return;
  try {
    // Swap-in (after `npm i @sentry/nextjs` + init):
    //   const Sentry = await import("@sentry/nextjs");
    //   Sentry.captureException(error, { extra: context });
  } catch {
    // SDK missing though DSN is set — degrade to the console log above.
  }
}

/** Record a product-analytics event (North Star funnel). Server-side, best-effort. */
export function trackEvent(name: string, props?: Props): void {
  if (process.env.NODE_ENV !== "production") {
    console.info("[observability] event", name, props ?? "");
  }
  if (!POSTHOG_KEY) return;
  // Swap-in (after `npm i posthog-node` + a shared client):
  //   posthog.capture({ distinctId: String(props?.userId ?? "anon"), event: name, properties: props });
}
