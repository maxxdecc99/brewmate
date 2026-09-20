"use client";

import Link from "next/link";

// Shared by /pricing and UpgradePrompt so both checkout entry points show
// the exact same combined consent copy. Keep the visible wording here in
// sync with CONSENT_TEXT in lib/consent.ts (that constant is what actually
// gets persisted, since it can't carry JSX links).
export default function ConsentCheckbox({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-3 text-sm text-muted font-medium cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 accent-terracotta cursor-pointer"
      />
      <span>
        I agree to the{" "}
        <Link
          href="/legal/terms-of-service"
          target="_blank"
          rel="noopener noreferrer"
          className="text-ink underline hover:text-terracotta"
        >
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link
          href="/legal/privacy-policy"
          target="_blank"
          rel="noopener noreferrer"
          className="text-ink underline hover:text-terracotta"
        >
          Privacy Policy
        </Link>
        , and I want immediate access to Brew+, understanding that I waive my 14-day right
        of withdrawal for this digital service.
      </span>
    </label>
  );
}
