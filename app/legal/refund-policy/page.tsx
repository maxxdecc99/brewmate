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
        <p className="text-muted font-medium text-sm">Last updated: October 6, 2026</p>
      </div>

      <div className="legal-content">
        <h2>1. Free tier</h2>
        <p>The Free tier of GetYourBrew is provided at no cost; no payment means no refund applies.</p>

        <h2>2. Brew+ subscriptions</h2>
        <p>Brew+ is a recurring digital subscription billed via Stripe.</p>

        <h3>14-day right of withdrawal</h3>
        <p>
          If you are a consumer in the EU, you can withdraw from your Brew+ purchase within 14
          days of subscribing, without giving a reason. To do so, email team@getyourbrew.com
          within 14 days of your purchase. We will refund the full amount you paid within 14 days
          of receiving your request, using the original payment method.
        </p>

        <h3>Cancellations</h3>
        <ul>
          <li>You can cancel at any time via the Customer Portal in your account settings.</li>
          <li>
            Cancelling stops future billing. After the 14-day withdrawal period, the current
            billing period is not refunded, and you keep Brew+ access until it ends.
          </li>
        </ul>

        <h3>Exceptions</h3>
        <p>
          We may issue a discretionary refund for a verified billing error on our part (for
          example a duplicate charge), or for a service outage that materially prevented you from
          using Brew+ for an extended period. Send requests to team@getyourbrew.com. We aim to
          respond within 5 business days.
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
