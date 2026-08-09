interface DecorProps {
  className?: string;
}

/** Two rising wavy steam lines — echoes the onboarding screen in the mockup. */
export function SteamLines({ className = "" }: DecorProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 46 46"
      className={className}
      fill="none"
    >
      <path
        d="M14 30 C10 22 16 18 14 10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M24 32 C20 24 26 20 24 12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** A simple coffee bean outline with its characteristic center crease. */
export function CoffeeBean({ className = "" }: DecorProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 32 44"
      className={className}
      fill="none"
    >
      <path
        d="M16 2C7 2 2 12 2 22c0 10 5 20 14 20s14-10 14-20C30 12 25 2 16 2Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M16 4C12 12 20 16 16 24C12 32 20 36 16 42"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** A single teardrop / coffee-drip shape. */
export function Drop({ className = "" }: DecorProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 32"
      className={className}
      fill="currentColor"
    >
      <path d="M12 0C12 0 2 14 2 21a10 10 0 0 0 20 0C22 14 12 0 12 0Z" />
    </svg>
  );
}
