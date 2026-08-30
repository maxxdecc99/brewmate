// Server-side event capture for webhook handlers, where the ground truth
// only exists on the server (e.g. Stripe events). posthog-js is a browser
// SDK and can't run in a serverless/Node route (no window/document), so
// this posts directly to PostHog's HTTP capture endpoint instead.
export async function captureServerEvent(
  event: string,
  distinctId: string,
  properties?: Record<string, unknown>
) {
  if (process.env.NODE_ENV !== "production") return;

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;
  if (!key || !host) return;

  try {
    await fetch(`${host}/i/v0/e/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: key,
        event,
        distinct_id: distinctId,
        properties,
      }),
    });
  } catch (err) {
    console.error("PostHog server capture failed:", err);
  }
}
