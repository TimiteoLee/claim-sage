# feat: Claims Management, Stripe Payments, and 2FA

## Enhancement Summary

**Deepened on:** 2026-03-13
**Sections enhanced:** 6
**Research agents used:** Security Sentinel, Kieran TypeScript Reviewer, Architecture Strategist, Performance Oracle, Data Integrity Guardian, Frontend Races Reviewer, Code Simplicity Reviewer, Pattern Recognition Specialist, Best Practices Researcher, Context7 (Stripe + Next.js docs)

### Key Improvements
1. Webhook idempotency — add processed events tracking to prevent duplicate upgrades
2. Missing DB index on `claims.user_id` — critical for query performance at scale
3. 2FA login enforcement — current setup is decorative only, needs auth flow integration
4. Backup codes for 2FA — users need a recovery mechanism
5. Frontend race condition — shared `submitting` flag in 2FA component causes collisions

### New Considerations Discovered
- `claimAmount` stored as `text` allows arbitrary strings — should be `numeric` or validated
- Stripe customer should be pre-created and linked to user, not auto-created by Checkout
- TOTP secrets stored in plaintext — should be encrypted at rest
- Rate limiting needed on 2FA verification to prevent brute force

---

## Overview

Three features shipped in parallel: Claims CRUD for tracking insurance claims, Stripe Checkout for Pro tier subscriptions, and TOTP-based two-factor authentication. All three are integrated into the settings page and sidebar navigation.

## Problem Statement / Motivation

Claim Sage needed core insurance claim tracking, a monetization path (freemium to Pro), and account security via 2FA to be a viable product.

## What Was Built

### Claims Management
- **Schema**: `claims` table with 6 statuses (open/in_review/approved/denied/settled/closed), linked to users via FK
- **API**: Full CRUD at `/api/claims` and `/api/claims/[id]` with Zod validation, user-scoped queries
- **UI**: Claims list page with search, status badges (blue/amber, colorblind-safe), inline new claim form. Detail page with edit form and two-step delete confirmation
- **Files**:
  - `src/db/schema/claims.ts`
  - `src/app/api/claims/route.ts`
  - `src/app/api/claims/[id]/route.ts`
  - `src/app/(app)/claims/page.tsx`
  - `src/app/(app)/claims/[id]/page.tsx`

#### Research Insights — Claims

**Performance:**
- **CRITICAL: Missing index on `claims.user_id`**. Every query filters by `userId` but no index exists. At scale (500K rows), this becomes a full sequential scan per request. Add a compound index on `(user_id, updated_at DESC)` to cover both the filter and sort.
- Claims list query is unbounded — add pagination (`LIMIT`/`OFFSET` or cursor-based) to prevent loading thousands of claims.

**Data Integrity:**
- `claimAmount` stored as `text` allows arbitrary strings (e.g., "lots of money"). Should use `numeric` type or add Zod validation with regex for currency format.
- Consider adding a `notes` or `timeline` table for claim activity history.

**Type Safety:**
- Client-side `Claim` interface duplicated in both `claims/page.tsx` and `claims/[id]/page.tsx` with `status: string`. Should share a type derived from the Drizzle schema's enum union.

**Implementation:**
```typescript
// src/db/schema/claims.ts — Add index
import { index } from "drizzle-orm/pg-core";

export const claims = pgTable("claims", {
  // ... existing columns ...
}, (table) => [
  index("claims_user_id_updated_at_idx").on(table.userId, table.updatedAt),
]);
```

---

### Stripe Payments
- **Checkout**: `POST /api/stripe/checkout` creates subscription session, redirects to Stripe
- **Webhook**: `POST /api/stripe/webhook` handles `checkout.session.completed` (upgrade to pro) and `customer.subscription.deleted` (downgrade to free)
- **Lazy init**: Stripe client instantiated inside handlers to avoid build-time crashes without env vars
- **Files**:
  - `src/app/api/stripe/checkout/route.ts`
  - `src/app/api/stripe/webhook/route.ts`

#### Research Insights — Stripe

**Webhook Idempotency (CRITICAL):**
Stripe may deliver the same event multiple times. The current webhook handler will re-upgrade a user on duplicate `checkout.session.completed` events. Add a processed events table:

```sql
CREATE TABLE stripe_webhook_events (
  event_id     TEXT PRIMARY KEY,  -- Stripe event ID (evt_xxx)
  event_type   TEXT NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

Check before processing:
```typescript
// In webhook handler, before processing any event:
const existing = await db.select().from(stripeWebhookEvents)
  .where(eq(stripeWebhookEvents.eventId, event.id)).limit(1);
if (existing.length > 0) {
  return NextResponse.json({ received: true }); // Already processed
}
// ... process event ...
await db.insert(stripeWebhookEvents).values({
  eventId: event.id, eventType: event.type
});
```

**Customer Management:**
Current checkout creates a Stripe customer implicitly via `customer_email`. Better to pre-create a Stripe Customer and store `stripeCustomerId` on the user, then pass `customer: stripeCustomerId` to the checkout session. This enables:
- Customer Portal for self-service subscription management
- Clean bidirectional mapping between app users and Stripe customers
- Consistent customer ID across checkout sessions

**Subscription Lifecycle:**
Add handling for `customer.subscription.updated` to catch status changes (past_due, unpaid). The current handler only catches `deleted`, missing cases where payment fails but subscription isn't fully canceled yet.

**Error Handling:**
The webhook handler should catch business logic errors separately and still return 200 to prevent Stripe retries:

```typescript
try {
  switch (event.type) { /* ... */ }
} catch (err) {
  console.error(`Error processing ${event.type}:`, err);
  // Still return 200 — business logic errors shouldn't trigger retries
}
return NextResponse.json({ received: true });
```

**References:**
- Stripe idempotency keys: All POST requests accept `Idempotency-Key` header (V4 UUID, max 255 chars)
- Stripe Customer Portal: `POST /v1/billing_portal/sessions` for self-service management
- Next.js App Router: Route Handlers receive standard Web `Request` — no `bodyParser` config needed

---

### Two-Factor Authentication
- **Schema**: `totp_secrets` table, one secret per user, verified flag
- **API**: Setup (generate secret + QR), verify (validate code), status check, disable (requires valid code)
- **UI**: `TwoFactorSetup` component with state machine (loading/disabled/setup/enabled)
- **Files**:
  - `src/db/schema/totp.ts`
  - `src/app/api/2fa/setup/route.ts`
  - `src/app/api/2fa/verify/route.ts`
  - `src/app/api/2fa/status/route.ts`
  - `src/app/api/2fa/disable/route.ts`
  - `src/components/settings/two-factor-setup.tsx`

#### Research Insights — 2FA

**Login Enforcement (CRITICAL — currently not working):**
The `authorize()` callback in `auth.ts` returns a session after validating only email + password. Even with 2FA enrolled, login never prompts for a TOTP code. This is purely decorative security.

**Recommended approach:**
1. After password validation in `authorize()`, check if user has a verified TOTP record
2. If yes, return an error or partial response indicating 2FA is required
3. Create a `/login/2fa` page that accepts the code
4. Use NextAuth's `signIn` callback or a custom flow to complete authentication

**Backup Codes:**
Users need a recovery mechanism if they lose their authenticator device. Generate 10 single-use codes during setup, hash them with bcrypt, show once. Accept backup codes as an alternative to TOTP during login.

**Rate Limiting:**
No rate limiting on `/api/2fa/verify` or `/api/2fa/disable`. An attacker with session access could brute-force the 6-digit code (1M possibilities). Add:
- Max 5 attempts per 15 minutes
- Exponential backoff after failures
- Account lockout after 10 consecutive failures

**Secret Storage:**
TOTP secrets stored in plaintext in the database. Should encrypt with AES-256-GCM using a server-side key from env vars. If the database is compromised, all TOTP secrets are exposed.

**Frontend Race Condition (HIGH):**
`two-factor-setup.tsx` uses a single `submitting` boolean to guard three distinct async operations (`startSetup`, `verifyCode`, `disable2FA`). If the user triggers one operation and the state transitions quickly, another operation could start before the first completes. Use separate loading states per operation or a state machine library.

**Dead Code:**
`checkStatus` function (lines 22-32) is defined but never called. Only `check2FAStatus` is used. Remove it.

---

## Gaps & Issues Found

### Must Fix

- [x] **Layout pageTitles missing claims** — `src/app/(app)/layout.tsx` doesn't include `"/claims": "Claims"` in the pageTitles map, so topbar shows wrong title
- [x] **`.env.example` missing Stripe vars** — Add `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- [x] **Missing DB index on `claims.user_id`** — Every claims query does a sequential scan without this
- [x] **Dead code: `checkStatus` in `two-factor-setup.tsx`** — Remove unused function

### Should Fix

- [ ] **2FA not enforced at login** — TOTP setup exists but `auth.ts` `authorize()` never checks for a TOTP code. Users can enroll but it doesn't block login without a code
- [ ] **Webhook idempotency** — Duplicate events could re-upgrade users. Add processed events table
- [ ] **Frontend race condition in 2FA component** — Shared `submitting` flag guards 3 different operations
- [ ] **Unbounded claims list query** — No pagination, will degrade at scale
- [x] **Shared `Claim` type** — Duplicated interface in two page files, now derives from schema `ClaimStatus`

### Nice to Have

- [ ] **Encrypt TOTP secrets at rest** — Currently plaintext in DB
- [ ] **Backup codes for 2FA** — Recovery mechanism when authenticator is lost
- [ ] **Rate limiting on 2FA verification** — Prevent brute force of 6-digit codes
- [ ] **Stripe Customer pre-creation** — Store `stripeCustomerId` on user for Customer Portal
- [ ] **`claimAmount` type** — Change from `text` to `numeric` or add validation
- [ ] **Handle `customer.subscription.updated`** — Catch payment failures before full cancellation

## Technical Considerations

- **Stripe lazy init** pattern matches the existing `db` null-guard pattern for build-time safety
- **Settings page** uses `Suspense` boundary for `useSearchParams()` (Next.js 15+ requirement)
- **Auth guard** pattern consistent: every API route checks `session?.user?.id` first
- **Color accessibility**: All status indicators use blue/amber + icons, never red/green

### Architecture Notes

- Clean user-centric data model: every entity FKs to `users.id` with cascade delete
- Consistent API pattern across all routes: auth check → validate → query → respond
- Route Handler approach for webhooks is correct for App Router — no bodyParser config needed
- The `(app)` / `(auth)` route group separation is well-structured

## Acceptance Criteria

- [x] Claims CRUD works end-to-end (create, read, update, delete)
- [x] Claims list has search/filter and status badges
- [x] Stripe Checkout redirects to payment page
- [x] Webhook upgrades/downgrades user tier
- [x] 2FA setup generates QR code and validates TOTP codes
- [x] 2FA can be enabled and disabled from settings
- [x] Sidebar shows all 6 nav items
- [x] Middleware protects `/claims` routes
- [x] Build passes with no type errors
- [x] Schema pushed to Neon
- [x] Layout pageTitles includes Claims
- [x] .env.example updated with Stripe vars
- [x] DB index on claims.user_id added
- [x] Dead code removed from two-factor-setup.tsx

## References

- Commit: `4e69775` — "feat: Claims management, Stripe payments, and 2FA"
- Stripe API version: `2026-02-25.clover`
- TOTP: `otpauth` library, SHA1, 6 digits, 30s period
- Stripe webhook docs: raw body via `req.text()`, signature verification within 5-minute window
- Stripe idempotency: `Idempotency-Key` header on POST requests, V4 UUID, 255 char max
- Stripe Customer Portal: `POST /v1/billing_portal/sessions` for self-service management
