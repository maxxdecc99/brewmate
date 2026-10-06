# GetYourBrew — AI Coffee Recipe Assistant

MVP web app. Generate precise coffee recipes based on beans, brew method and gear.

## Stack
- Next.js 16 (App Router) + TypeScript
- Tailwind CSS
- Anthropic API (claude-sonnet-4-6)
- localStorage for brew log (MVP — upgrade to Supabase later)
- Vercel deployment

## Setup

1. Add your Anthropic API key to `.env.local`:
   ```
   ANTHROPIC_API_KEY=your_key_here
   ```
2. `npm install`
3. `npm run dev`

## Structure

```
app/
  page.tsx              # Landing / Home
  generate/page.tsx     # Recipe form + result view
  log/page.tsx          # Brew log overview
  log/[id]/page.tsx     # Saved recipe detail
  api/generate-recipe/  # AI API route

lib/
  prompts/
    index.ts            # Route to correct prompt builder
    pourover.ts         # V60, Kalita, Chemex
    espresso.ts         # Espresso
    aeropress.ts        # AeroPress
    frenchpress.ts      # French Press
    utils.ts            # Shared: roast normalization, temp, grind notes
  brewLog.ts            # localStorage CRUD

components/ui/
  Navbar.tsx
  RecipeCard.tsx        # Metric display card
  StarRating.tsx

types/index.ts          # All TypeScript interfaces
```

## MVP Roadmap
- [x] Recipe form (all fields)
- [x] AI recipe generation (structured JSON)
- [x] Recipe result display (cards + steps)
- [x] Save to brew log
- [x] Brew log overview
- [x] Recipe detail page with editable rating/notes

## Next Steps (post-MVP)
- Supabase for persistent storage + user accounts
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
