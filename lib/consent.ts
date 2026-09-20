// Single source of truth for the checkout consent checkbox (ToS + Privacy
// + 14-day withdrawal waiver) shown on /pricing and UpgradePrompt.
//
// CONSENT_TEXT is what create-subscription-checkout writes into
// checkout_consents.consent_text — components/ui/ConsentCheckbox.tsx
// renders the same wording (split around the inline ToS/Privacy links),
// so keep the two in sync by hand whenever this copy changes.
//
// Bump CONSENT_VERSION any time CONSENT_TEXT changes, so past acceptances
// stay tied to the exact wording that was shown when they were made.
export const CONSENT_VERSION = "2026-09-checkbox-v1";

export const CONSENT_TEXT =
  "I agree to the Terms of Service and Privacy Policy, and I want immediate access to Brew+, understanding that I waive my 14-day right of withdrawal for this digital service.";
