import { captureError } from "@/lib/observability";

// Next.js instrumentation. `register` runs once at server startup (init SDKs here later).
// `onRequestError` funnels uncaught request errors into the observability facade.
export async function register(): Promise<void> {
  // Swap-in: Sentry/OpenTelemetry init when the SDK is added.
}

export async function onRequestError(
  error: unknown,
  request: { path?: string; method?: string },
): Promise<void> {
  await captureError(error, { path: request.path, method: request.method });
}
