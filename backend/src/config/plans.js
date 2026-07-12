// Plan pricing/features are DB-backed (see the Plan model) and editable by
// admins from the Plans page. Only the flat per-credit rate stays fixed here.
export const PRICE_PER_CREDIT_SAR = 49;

// A single Dodo product representing "1 job credit", charged at quantity =
// number of credits purchased. Must be created in the Dodo dashboard and its
// id placed here (or overridden via env) before credit-pack checkout works.
export const CREDIT_PACK_DODO_PRODUCT_ID = process.env.DODO_CREDIT_PACK_PRODUCT_ID || null;
