import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service — GetYourBrew",
};

export default function TermsOfServicePage() {
  return (
    <article className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 pb-6 border-b-2 border-ink">
        <span className="font-heading text-xs font-bold uppercase tracking-widest text-terracotta">
          /// Legal
        </span>
        <h1 className="font-heading text-4xl sm:text-5xl font-extrabold uppercase tracking-tight text-ink">
          Terms of Service
        </h1>
        <p className="text-muted font-medium text-sm">Last updated: September 20, 2026</p>
      </div>

      <div className="legal-content">
        <h2>1. Introduction</h2>
        <p>
          These Terms of Service (&quot;Terms&quot;) govern your use of GetYourBrew, a service
          operated by Sip and Build (KVK 42168096), Rhododendronstraat 71, 2563SW, Den Haag,
          Netherlands (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;).
        </p>
        <p>By creating an account or using GetYourBrew, you agree to these Terms.</p>

        <h2>2. The service</h2>
        <p>
          GetYourBrew is an AI-powered coffee recipe generation and logging application. We offer
          a Free tier with limited functionality and a paid subscription tier (&quot;Brew+&quot;)
          with expanded features, billed monthly, semi-annually, or annually via Stripe.
        </p>
        <p>
          We may modify, suspend, or discontinue features of the service at any time. We will
          make reasonable efforts to notify users of material changes.
        </p>

        <h2>3. Accounts</h2>
        <ul>
          <li>You must provide accurate information when creating an account</li>
          <li>You are responsible for maintaining the confidentiality of your account credentials</li>
          <li>
            You must be at least 16 years old to use GetYourBrew (in line with GDPR&apos;s minimum
            age for consent to data processing without parental permission)
          </li>
          <li>One account per person; you may not share account access</li>
        </ul>

        <h2>4. Subscriptions and billing</h2>
        <ul>
          <li>
            Brew+ subscriptions are billed in advance on a recurring basis (monthly,
            semi-annual, or annual, depending on your selected plan)
          </li>
          <li>Subscriptions automatically renew unless cancelled before the renewal date</li>
          <li>
            You can cancel anytime via the Customer Portal in your account settings; cancellation
            takes effect at the end of the current billing period
          </li>
          <li>
            Prices may change; we will notify existing subscribers before any price change takes
            effect for their renewal
          </li>
        </ul>
        <p>
          See our <Link href="/legal/refund-policy">Refund Policy</Link> for details on refunds.
        </p>

        <h2>5. Acceptable use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>Use the service for any unlawful purpose</li>
          <li>Attempt to reverse-engineer, scrape, or interfere with the service</li>
          <li>Circumvent subscription limits through technical means</li>
          <li>Upload harmful, offensive, or infringing content</li>
        </ul>
        <p>We reserve the right to suspend or terminate accounts that violate these Terms.</p>

        <h2>6. Intellectual property</h2>
        <ul>
          <li>The GetYourBrew app, branding, and underlying technology are owned by Sip and Build</li>
          <li>
            Recipes you generate and save are yours to use freely; we do not claim ownership over
            your saved content
          </li>
          <li>
            You grant us a limited license to store and process your content solely to provide
            the service
          </li>
        </ul>

        <h2>7. AI-generated content disclaimer</h2>
        <p>
          GetYourBrew uses AI to generate coffee recipes and recommendations. We do not guarantee
          the accuracy, safety, or suitability of any AI-generated recipe. Use your own judgment,
          particularly regarding ingredient quantities, caffeine content, and any dietary or
          health considerations.
        </p>

        <h2>8. Limitation of liability</h2>
        <p>
          To the maximum extent permitted by law, Sip and Build is not liable for any indirect,
          incidental, or consequential damages arising from your use of the service. Our total
          liability for any claim is limited to the amount you paid us in the 12 months preceding
          the claim.
        </p>

        <h2>9. Termination</h2>
        <p>
          You may delete your account at any time. We may suspend or terminate your access if you
          violate these Terms. Upon termination, your right to use the service ends immediately;
          your data is handled per our Privacy Policy.
        </p>

        <h2>10. Governing law</h2>
        <p>
          These Terms are governed by the laws of the Netherlands. Disputes will be submitted to
          the competent court in Den Haag, Netherlands, unless mandatory consumer protection law
          provides otherwise.
        </p>

        <h2>11. Contact</h2>
        <p>team@getyourbrew.com</p>
      </div>
    </article>
  );
}
