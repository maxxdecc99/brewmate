export const SUBSCRIPTION_PLANS = [
  {
    id: "monthly",
    label: "Monthly",
    priceLabel: "€3,99",
    interval: "/ month",
    billedAs: null,
    badge: null,
  },
  {
    id: "semiannual",
    label: "6 Months",
    priceLabel: "€2,49",
    interval: "/ month",
    billedAs: "Billed as €14,94 every 6 months",
    badge: "Most Popular",
  },
  {
    id: "annual",
    label: "Annual",
    priceLabel: "€1,99",
    interval: "/ month",
    billedAs: "Billed as €23,88 every year",
    badge: "Best Value",
  },
] as const;

export type PlanId = (typeof SUBSCRIPTION_PLANS)[number]["id"];
