import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

// No-op when Sentry.init() hasn't run (i.e. outside production), same as
// every other Sentry capture call.
export const onRequestError = Sentry.captureRequestError;
