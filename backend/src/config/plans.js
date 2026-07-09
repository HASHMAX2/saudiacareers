export const PLANS = {
  FREE: {
    tier: "FREE",
    name: "Free",
    priceSar: 0,
    paidCreditsGranted: 0,
    features: ["1 published job per month", "Basic applicant tracking", "Company verification required"],
  },
  STARTER: {
    tier: "STARTER",
    name: "Starter",
    priceSar: 199,
    paidCreditsGranted: 5,
    features: ["5 paid job credits / month", "Application management", "Email support"],
  },
  GROWTH: {
    tier: "GROWTH",
    name: "Growth",
    priceSar: 599,
    paidCreditsGranted: 20,
    features: ["20 paid job credits / month", "Featured listing options", "Priority support"],
  },
};

export const PLAN_LIST = Object.values(PLANS);

// Flat rate for buying extra job credits outside of a plan's monthly allowance.
export const PRICE_PER_CREDIT_SAR = 49;
