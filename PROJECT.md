# GetYourBrew — AI Coffee Recipe Assistant

Web app that generates precise coffee recipes from your beans, brew method and gear, with a brew timer and a personal brew log. Live at https://getyourbrew.com (also getyourbrew.nl).

## Stack
- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS 4
- Anthropic API (`claude-sonnet-4-6`) for recipe generation
- Supabase: auth (email/password, password reset) and Postgres with RLS (profiles, recipes, checkout_consents, waitlist)
- Stripe: Brew+ subscriptions (monthly, 6-month, annual) via Checkout, Customer Portal and webhook
- Resend: SMTP for Supabase auth emails (sender domain getyourbrew.com)
- Sentry for errors, PostHog for product analytics
- Vercel hosting (project `brewmate`); pushes to `main` can deploy to production automatically

## Setup

1. Create `.env.local` with:
   ```
   ANTHROPIC_API_KEY=
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_ROLE_KEY=        # server-only, never NEXT_PUBLIC_
   STRIPE_SECRET_KEY=
   STRIPE_WEBHOOK_SECRET=
   STRIPE_PRICE_MONTHLY=
   STRIPE_PRICE_SEMIANNUAL=
   STRIPE_PRICE_ANNUAL=
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   NEXT_PUBLIC_POSTHOG_KEY=
   NEXT_PUBLIC_POSTHOG_HOST=
   NEXT_PUBLIC_SENTRY_DSN=
   SENTRY_DSN=
   ```
   Or pull them from Vercel with `vercel env pull .env.local`.
2. `npm install`
3. `npm run dev`

Database changes live in `supabase/migrations/`.

## Structure

```
app/
  page.tsx                      # Home
  generate/                     # Recipe form + AI result (Brew+)
  brew/timer/                   # Step-by-step brew timer, post-brew rating
  log/                          # Brew log, recipe detail, manual recipes (log/add, log/manual/[id])
  pricing/                      # Brew+ plans + checkout consent
  account/, settings/           # Account, subscription management (Customer Portal)
  admin/                        # Admin overview + subscription adjuster (is_admin only)
  auth/                         # login, register, forgot/reset password, callback (code + token_hash)
  legal/                        # Terms of Service, Privacy Policy, Refund Policy
  api/
    generate-recipe/            # Anthropic call
    create-subscription-checkout/  # Records consent, creates Stripe Checkout session
    stripe/portal/              # Stripe Customer Portal session
    webhooks/stripe/            # Subscription lifecycle → profiles
    admin/adjust-subscription/  # Admin grant/revoke Brew+
    delete-account/, waitlist/

lib/
  prompts/                      # Prompt builders per brew method (pourover, espresso, aeropress, frenchpress)
  supabase/                     # client.ts (browser), server.ts (cookie client + service-role client)
  recipes.ts                    # Recipe CRUD against Supabase
  stripe.ts, subscriptionPlans.ts  # Stripe client, plan → price ID mapping
  consent.ts                    # Checkout consent text + version
  posthog.ts, posthog-server.ts, passwordValidation.ts

components/ui/                  # Navbar, MobileTabBar, UpgradePrompt, ConsentCheckbox, RecipeCard, StarRating, …
middleware.ts                   # Session refresh, protected routes, auth-code forwarding
types/index.ts                  # Shared TypeScript types
```

## Plans
- **Free:** up to 10 manual recipe logs, no AI generation.
- **Brew+:** unlimited AI recipes and logs. €3.99/month, €14.94 per 6 months or €23.88/year. 14-day EU right of withdrawal applies.

## Next steps
- Coffee bag scanning (camera → OCR → autofill)
- Recipe improvement from ratings
- Mobile / iOS app

## Status — 2026-10-06

### Done today
- Resend domain verified, so auth emails (signup confirmation, password reset) send again.
- Password reset handles the `token_hash` link flow (`verifyOtp` in `app/auth/callback/route.ts`). The callback logs real errors, only redirects to same-site `next` paths, and the login page shows an "invalid or expired link" message.
- The 14-day EU right of withdrawal is kept. Checkout consent covers only the Terms of Service and Privacy Policy (`CONSENT_VERSION = "2026-10-checkbox-v2"`), and the Refund Policy is updated to match.
- The mobile nav changes depending on whether the user is logged in.
- /pricing shows a sign-up CTA to logged-out visitors.
- Generate → brew → finish flow saves recipes automatically and asks for a rating after brewing.
- Stale (test-mode) Stripe customer IDs are recovered in the checkout and portal routes.
- Service client fix: `createServiceClient()` uses the service role key with no user session, so it no longer runs as the logged-in user. This fixes the checkout 500 caused by RLS blocking the `checkout_consents` insert. The checkout route now logs its failures, and /pricing and UpgradePrompt show an error message when checkout fails.
- Stripe live keys, price IDs and webhook endpoint are configured.

### Open
- Stripe business verification is in review. Payments stay inactive until it's approved.
- `STRIPE_WEBHOOK_SECRET` in Vercel must be re-pasted with the live `whsec_` value, then redeployed.
- Test a checkout click and confirm the first row appears in `checkout_consents`.
- Live €3.99 payment test, then refund it.
- Confirm the webhook event shows "Succeeded" in Stripe.
- Improve the design of the auth email templates.
- "Brew again" for manual recipes still uses the old sessionStorage key (`app/log/manual/[id]/page.tsx`).
- The Vercel CLI is out of date (54.16.0 installed, 61.0.0 available).
