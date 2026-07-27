# Prompt: Redesign the employer billing page (full feature set)

Copy everything below into Claude Code, inside your project repo.

---

## 0. Setup (do this first)

I've dropped a mockup at `reference/employer-billing-mockup.html` (create the
`reference/` folder if it doesn't exist, and put the file there before you
run this). It shows the layout, information hierarchy, and full feature set
I'm going for — every feature in it should end up real and working, not
just visual.

**Important: ignore the mockup's colors.** It uses a placeholder palette
(violet `#5B4BF0`, mint `#DDF8EE`, amber `#FFF3D6`, dark `#111827`). Do not
copy these. Use it only for structure, spacing rhythm, content hierarchy,
and UX patterns (card layout, invoice row layout, plan matrix, FAQ
accordion, etc.).

## 1. Discover our actual design system before writing UI code

Before building anything, inspect this repo and report back:
- Our color tokens (Tailwind config / CSS variables / theme file — wherever
  we define them) — primary, neutral, success, warning, danger, backgrounds
- Our type scale and font families
- Our spacing/radius/shadow scale
- Existing shared components we already have (Button, Card, Badge, Table,
  Tabs, Modal, EmptyState, etc.) and their prop APIs
- The routing/folder convention for pages like this one

Reuse existing components wherever they cover a need on this page instead of
building new ones. Every color used on the billing page must map to an
existing token in our system — don't introduce new hex values for this page.

## 2. Audit what already exists on the backend before building anything new

Before touching each feature below, check the repo for an existing model,
API route, or service that already covers it (subscriptions, invoices,
payment methods, billing profile, usage tracking, etc.).

- **If it already exists:** wire the redesigned UI to the real endpoint/data
  and use it as-is. Don't rebuild backend logic that's already there.
- **If it doesn't exist yet:** build what's needed — DB schema/migration,
  API endpoint(s), and the business logic — so the feature is fully
  functional, not a stub or placeholder. Follow the existing patterns in the
  codebase (ORM, auth middleware, validation, error handling, etc.) for
  consistency.

Every feature in the mockup should end up real and working. Nothing should
be left as a disabled button or "coming soon" placeholder unless you hit a
genuine blocker (see §5) — in that case, tell me what the blocker is rather
than silently stubbing it.

## 3. Full feature list to implement

**Subscription & plan**
- Current plan summary — name, price, status, renewal date, billing cycle
- Auto-renewal toggle — actually persists and takes effect
- Change / upgrade / downgrade plan — with proration calculated correctly
  for the switch, reflected on the next invoice
- Cancel plan — end-of-cycle cancellation (plan stays active until the
  cycle ends, then stops renewing); update subscription status accordingly

**Payments**
- Upcoming charge breakdown — base plan / taxes / discount / total, computed
  from real plan + tax + discount data
- "Pay now" for a pending invoice — real checkout flow through Dodo
  Payments, with the invoice status updated via webhook (see §5)
- Payment method on file — display real card brand/last4/expiry
- Update / add payment method — real card entry flow through Dodo's client
  SDK (see §5 — this one has a hard constraint on card data)

**Billing profile**
- Billing address — view and edit, persisted
- GST / tax ID — view and edit, persisted, validated against the standard
  GSTIN format

**Invoices & transactions**
- Invoice ledger — real list from the DB: number, date, amount, status
- Download a single invoice as PDF
- Download all invoices (bulk/zip)
- Transaction history — a ledger of payment attempts, successes, failures,
  and refunds, separate from the invoice list

**Usage**
- Usage pulse — jobs posted, resume unlocks, storage used, candidate
  messages, team member count, and "% of billing cycle elapsed" — pulled
  from real usage data wherever we already track it elsewhere in the
  product; if we don't track something yet, add the minimal counter/query
  needed to report it here

**Other**
- Plan comparison table — Starter / Professional / Enterprise, can be
  config-driven rather than DB-driven since plans change rarely
- FAQ accordion — static content, client-side only
- Notification bell — we already have a notification system in the app;
  find it and wire this bell to the real, existing notifications data (same
  as every other "already exists" case in §2) rather than building anything
  new for it
- ⌘K search — out of scope for this page, leave as-is / don't touch

## 4. Data model guidance

Where you need new tables, model them close to this shape (adjust to match
our existing conventions/ORM):

```ts
type Subscription = {
  id: string;
  employerId: string;
  planId: string;
  status: 'active' | 'past_due' | 'canceled';
  renewalDate: string; // ISO date
  billingCycle: 'monthly' | 'annual';
  autoRenew: boolean;
};

type Invoice = {
  id: string;
  subscriptionId: string;
  date: string;
  amountMinor: number; // paise
  status: 'paid' | 'pending' | 'refunded';
  pdfUrl: string | null;
};

type Transaction = {
  id: string;
  invoiceId: string | null;
  type: 'charge' | 'refund' | 'failed_charge';
  amountMinor: number;
  createdAt: string;
};

type BillingProfile = {
  employerId: string;
  address: string;
  gstin: string | null;
};
```

## 5. Payment gateway: Dodo Payments

Use Dodo Payments (docs.dodopayments.com) as the payment gateway/Merchant of
Record for every billing action on this page. Check the repo first — if
Dodo is already partially integrated, use what's there instead of
reinstalling.

- Install the official SDK (`dodopayments` on npm for Node/TS) if it isn't
  already a dependency.
- Read `DODO_PAYMENTS_API_KEY` and `DODO_PAYMENTS_WEBHOOK_KEY` from env vars.
  Check `.env`/`.env.example` and the dashboard config first; if they're
  missing, stop and ask me for them rather than inventing placeholder
  values that silently fail.
- **Hard constraint on card data:** never store raw card numbers in our own
  DB. Card capture goes through Dodo's checkout/payment-method flow; we only
  ever persist Dodo's `customer_id`, `subscription_id`, and payment-method
  reference IDs on our side.
- Map each write action to its Dodo API:
  - Update/add payment method → `subscriptions.updatePaymentMethod`
  - Change/upgrade/downgrade plan → `subscriptions.changePlan` with a
    `proration_billing_mode`; call `subscriptions.previewChangePlan` first
    so the UI can show the customer the exact charge before they confirm
  - Cancel plan → `PATCH /subscriptions/{id}` with
    `cancel_at_next_billing_date: true` (end-of-cycle, not instant)
  - Pay now (pending invoice) → trigger Dodo's checkout/charge flow scoped
    to that invoice
  - Auto-renewal toggle → reflect Dodo's actual subscription state; if Dodo
    doesn't expose a clean "pause renewal without canceling" flag separate
    from full cancellation, tell me before assuming behavior — don't guess
- Set up a webhook endpoint and verify signatures with
  `client.webhooks.unwrap` (Dodo follows the Standard Webhooks spec). Handle
  at minimum: `payment.succeeded`, `payment.failed`, `subscription.active`,
  `subscription.on_hold`, `subscription.plan_changed`, `subscription.updated`,
  `subscription.canceled`, and refund events. Treat webhook events — not the
  synchronous API response — as the source of truth for our DB, since
  Dodo's own docs note the immediate response can be `processing` pending
  the real outcome.
- Pass the employer's billing address and GSTIN through as part of the Dodo
  customer object so it appears correctly on Dodo-generated invoices — Dodo
  requires billing address fields at checkout and auto-calculates GST for
  Indian customers from them.
- Design webhook handlers to be idempotent (safe to run twice) — Dodo
  retries failed deliveries.

## 6. Suggested build order

Not a scope cut, just a sane sequence so nothing blocks on something later:
1. Design tokens + shared layout shell
2. Read paths: plan summary, invoice ledger, usage pulse, billing profile,
   payment method display, plan comparison, FAQ
3. Write paths: edit billing profile/GST, auto-renew toggle, plan
   change/cancel, payment method update, pay now
4. Derived/heavier features: PDF generation (single + bulk), transaction
   history

## 7. Acceptance criteria

- Matches our existing design tokens and components — no visual elements
  that look imported from a different design system
- Fully responsive down to mobile
- Keyboard accessible (visible focus states, accordion is keyboard-operable)
- Every action actually does what it says (no dead clicks, no fake success
  states)
- New DB changes come with migrations; new endpoints have basic
  validation/error handling and auth checks consistent with the rest of the
  app

## 8. Wrap-up

At the end, give me a short summary: for each feature in §3, whether it was
wired to something that already existed or newly built end-to-end, plus any
blockers you flagged (e.g. payment gateway choice, if that wasn't already
clear from the repo) that need a decision from me.
