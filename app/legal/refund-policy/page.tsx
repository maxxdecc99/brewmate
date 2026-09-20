import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund Policy — GetYourBrew",
};

export default function RefundPolicyPage() {
  return (
    <article className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 pb-6 border-b-2 border-ink">
        <span className="font-heading text-xs font-bold uppercase tracking-widest text-terracotta">
          /// Legal
        </span>
        <h1 className="font-heading text-4xl sm:text-5xl font-extrabold uppercase tracking-tight text-ink">
          Refund Policy
        </h1>
        <p className="text-muted font-medium text-sm">Last updated: September 20, 2026</p>
      </div>

      <div className="legal-content">
        <h2>1. Free tier</h2>
        <p>The Free tier of GetYourBrew is provided at no cost; no payment means no refund applies.</p>

        <h2>2. Brew+ subscriptions</h2>
        <p>Brew+ is a recurring digital subscription service billed via Stripe.</p>

        <h3>Right of withdrawal (14-day cooling-off period)</h3>
        <p>
          Under EU consumer law, you generally have the right to withdraw from a purchase within
          14 days without giving a reason. However, for digital content/services delivered
          immediately upon purchase, this right does not apply once you have:
        </p>
        <p>
          (a) expressly requested that we begin providing the service immediately, and
          <br />
          (b) acknowledged that you thereby lose your right of withdrawal.
        </p>
        <p>
          By subscribing to Brew+ and confirming your purchase, you provide this consent and
          acknowledgment, and immediate access to Brew+ features begins upon successful payment.
        </p>

        <h3>Cancellations</h3>
        <ul>
          <li>You can cancel your subscription at any time via the Customer Portal</li>
          <li>
            Cancellation stops future billing but does not refund the current billing period —
            you retain Brew+ access until the end of the period you already paid for
          </li>
          <li>No partial refunds are given for unused time within a billing period</li>
        </ul>

        <h3>Exceptions</h3>
        <p>We may issue a discretionary refund in cases of:</p>
        <ul>
          <li>A verified billing error on our part (e.g. duplicate charge)</li>
          <li>
            A service outage that materially prevented you from using Brew+ for an extended
            period
          </li>
        </ul>
        <p>
          Refund requests can be sent to team@getyourbrew.com. We aim to respond within 5 business
          days.
        </p>

        <h2>3. Chargebacks</h2>
        <p>
          Please contact us before initiating a chargeback with your bank or card provider — we
          are generally able to resolve billing issues directly and faster than a chargeback
          process.
        </p>
      </div>
    </article>
  );
}
