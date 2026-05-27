# src/externalApi/

> ⚠ MAINTENANCE: once a third-party wrapper is added/removed/refactored, update this CLAUDE.md SAME SESSION.

## meta
- role: wrappers for third-party APIs (Stripe, Twilio, SendGrid, Google Maps, OpenAI, etc.)
- current_state: **EMPTY** (placeholder)
- layer: between `lib/` and `api/services/` — services call externalApi wrappers when they need third-party I/O

## convention (when populated)
```
externalApi/
  <provider>/
    client.ts             # SDK initialization (singleton)
    <feature>.ts          # business functions (createPayment, sendSms, geocode, …)
    types.ts              # TypeXxxRequest/Response shaped to internal API needs
    webhooks.ts           # webhook handlers (if provider sends events back)
```

Example layout (Stripe):
```
externalApi/
  stripe/
    client.ts             # const stripe = new Stripe(process.env.STRIPE_KEY, { apiVersion: "..." })
    payments.ts           # createCheckoutSession(), refund(), …
    webhooks.ts           # verifySignature(), handlePaymentSucceeded(), …
    types.ts              # TypeCheckoutSessionRequest, …
```

## general guidelines
- 1 sub-folder per provider
- ONE client singleton per provider (NEVER `new Stripe(...)` repeated)
- expose typed business functions, NOT raw SDK pass-through
- handle provider-specific errors → wrap in `ClassCustomError` for uniform error path
- API keys via env var (`STRIPE_KEY`, `TWILIO_AUTH_TOKEN`, …) — declare in `.env.example` (NOT committed) and document in root CLAUDE.md env table
- if the provider has webhooks: dedicate a router in `src/api/routers/<provider>Webhook.ts` that calls `externalApi/<provider>/webhooks.ts`

## dependency direction
- `api/services/` → `externalApi/<provider>/<feature>` ✓
- `externalApi/` → `lib/` ✓ (for ClassCustomError, trad)
- `externalApi/` → `api/` ✗ (NEVER — externalApi is a downstream layer)
- `externalApi/` → `configPrisma` — case-by-case (e.g. logging external calls in DB) but prefer keeping it side-effect-free

## new provider checklist
1. mkdir `externalApi/<provider>/`
2. install SDK: `npm install <sdk>`
3. add env vars in `.env` (template values) AND document in root CLAUDE.md env table
4. create `client.ts` with singleton init (guard against missing env var → throw ClassCustomError)
5. create `<feature>.ts` files for business operations
6. if webhooks: create webhooks.ts + corresponding router
7. update this CLAUDE.md (remove "EMPTY" state, add the provider section)

## invariants
- ONE client instance per provider
- errors from provider → wrap in ClassCustomError (don't leak SDK error types upward)
- secrets in env, NEVER in code
- ESM imports keep `.js`

## pitfalls
- creating multiple clients per request → quota/connection issues with most SDKs
- forgetting env var validation at client init → silent undefined → cryptic API errors at first call
- mixing webhook handling into `<feature>.ts` instead of dedicated `webhooks.ts` → harder to audit security (signature verification)

## why empty in template
No external service is required for the base template (HTTP + DB + WS suffice). Real projects will populate as needs arise (payments, SMS, email, etc.).
