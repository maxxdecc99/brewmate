import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — GetYourBrew",
};

export default function PrivacyPolicyPage() {
  return (
    <article className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 pb-6 border-b-2 border-ink">
        <span className="font-heading text-xs font-bold uppercase tracking-widest text-terracotta">
          /// Legal
        </span>
        <h1 className="font-heading text-4xl sm:text-5xl font-extrabold uppercase tracking-tight text-ink">
          Privacy Policy
        </h1>
        <p className="text-muted font-medium text-sm">Last updated: September 20, 2026</p>
      </div>

      <div className="legal-content">
        <h2>1. Who we are</h2>
        <p>
          GetYourBrew is operated by Sip and Build, a sole proprietorship (eenmanszaak)
          registered with the Dutch Chamber of Commerce (KVK) under number 42168096.
        </p>
        <p>Registered address: Rhododendronstraat 71, 2563SW, Den Haag, Netherlands</p>
        <p>Contact: team@getyourbrew.com</p>
        <p>Sip and Build is the data controller for the personal data described in this policy.</p>

        <h2>2. What data we collect</h2>
        <p>When you use GetYourBrew, we may collect:</p>
        <ul>
          <li>
            <strong>Account data</strong>: email address, password (hashed), display name
          </li>
          <li>
            <strong>Usage data</strong>: coffee recipes you create, save, or log; app interaction
            data
          </li>
          <li>
            <strong>Payment data</strong>: subscription status and plan; payment processing itself
            is handled entirely by Stripe — we do not store your card details
          </li>
          <li>
            <strong>Technical data</strong>: IP address, browser type, device information, error
            logs
          </li>
          <li>
            <strong>Communication data</strong>: emails you send us, support requests
          </li>
        </ul>

        <h2>3. How we use your data</h2>
        <p>We use your data to:</p>
        <ul>
          <li>Provide and maintain the GetYourBrew service</li>
          <li>Process subscription payments</li>
          <li>Send transactional emails (password resets, receipts, account notifications)</li>
          <li>Monitor and fix technical errors</li>
          <li>Understand how the app is used, to improve it</li>
          <li>Comply with legal obligations (e.g. tax records)</li>
        </ul>
        <p>We do not sell your personal data to third parties.</p>

        <h2>4. Third-party processors</h2>
        <p>
          We use the following third-party services to operate GetYourBrew. Each processes data
          on our behalf under their own privacy and security terms:
        </p>
        <table>
          <thead>
            <tr>
              <th>Service</th>
              <th>Purpose</th>
              <th>Data involved</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Supabase</td>
              <td>Database hosting, authentication</td>
              <td>Account data, recipes, usage data</td>
            </tr>
            <tr>
              <td>Stripe</td>
              <td>Payment processing</td>
              <td>Payment data, billing email</td>
            </tr>
            <tr>
              <td>PostHog</td>
              <td>Product analytics</td>
              <td>Usage data, technical data</td>
            </tr>
            <tr>
              <td>Sentry</td>
              <td>Error tracking</td>
              <td>Technical data, error logs</td>
            </tr>
            <tr>
              <td>Resend</td>
              <td>Transactional email delivery</td>
              <td>Email address, email content</td>
            </tr>
            <tr>
              <td>Vercel</td>
              <td>Application hosting</td>
              <td>Technical data</td>
            </tr>
          </tbody>
        </table>
        <p>
          These providers may process data outside the European Economic Area; where applicable,
          they do so under standard contractual clauses or equivalent safeguards.
        </p>

        <h2>5. Legal basis for processing</h2>
        <p>We process your data based on:</p>
        <ul>
          <li>
            <strong>Contract</strong>: to provide the service you signed up for
          </li>
          <li>
            <strong>Legitimate interest</strong>: to maintain and improve the app, and detect/fix
            errors
          </li>
          <li>
            <strong>Legal obligation</strong>: for tax and accounting records
          </li>
          <li>
            <strong>Consent</strong>: where required, e.g. for optional marketing communication
          </li>
        </ul>

        <h2>6. Data retention</h2>
        <p>
          We retain your account data for as long as your account is active. If you delete your
          account, we delete your personal data within 30 days, except where we are legally
          required to retain records (e.g. financial records for Dutch tax purposes, typically 7
          years).
        </p>

        <h2>7. Your rights</h2>
        <p>Under the GDPR, you have the right to:</p>
        <ul>
          <li>Access the personal data we hold about you</li>
          <li>Correct inaccurate data</li>
          <li>Request deletion of your data</li>
          <li>Object to or restrict certain processing</li>
          <li>Request a copy of your data in a portable format</li>
          <li>Withdraw consent at any time, where processing is based on consent</li>
        </ul>
        <p>
          To exercise any of these rights, contact us at team@getyourbrew.com. You also have the
          right to lodge a complaint with the Dutch Data Protection Authority (Autoriteit
          Persoonsgegevens).
        </p>

        <h2>8. Security</h2>
        <p>
          We take reasonable technical and organizational measures to protect your data,
          including encrypted data storage and secure authentication. No system is 100% secure,
          and we cannot guarantee absolute security.
        </p>

        <h2>9. Changes to this policy</h2>
        <p>
          We may update this policy from time to time. Material changes will be communicated via
          email or in-app notice.
        </p>

        <h2>10. Contact</h2>
        <p>Questions about this policy: team@getyourbrew.com</p>
      </div>
    </article>
  );
}
