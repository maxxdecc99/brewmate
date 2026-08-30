import * as Sentry from "@sentry/nextjs";

if (process.env.NODE_ENV === "production") {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 0.1,
  });
}
