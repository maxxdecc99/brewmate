import posthog from "posthog-js";

let initialized = false;

export function initPostHog() {
  if (initialized || typeof window === "undefined") return;
  if (process.env.NODE_ENV !== "production") return;

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;
  if (!key || !host) return;

  posthog.init(key, {
    api_host: host,
    autocapture: true,
    capture_pageview: true,
    person_profiles: "identified_only",
    session_recording: {},
  });
  initialized = true;
}

// Thin wrappers so call sites don't need to know/guard against PostHog
// being uninitialized outside production.
export function capture(event: string, properties?: Record<string, unknown>) {
  if (!initialized) return;
  posthog.capture(event, properties);
}

export function identify(
  userId: string,
  properties?: Record<string, unknown>
) {
  if (!initialized) return;
  posthog.identify(userId, properties);
}

export { posthog };
