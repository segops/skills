---
name: track-event
description: "Design a canonical SegOps event and wire the emit calls into a codebase. Use when a developer wants to track a new event, add a custom event to SegOps, define an event schema/payload, instrument a user action (signup, purchase, feature used), or asks how to emit a specific event. Picks a canonical event name + payload, then adds segops.track() calls at the right places. Assumes @segops/sdk is already installed."
argument-hint: "What to track, e.g. \"checkout completed\" or \"trial started\""
---

# Track a SegOps event

Design one well-formed event and wire it into the code. This skill is for the
**modeling + instrumentation** step — it does not register the event in the
SegOps schema registry (that needs the Admin SDK) and does not install the SDK.

**Prerequisite:** `@segops/sdk` is already installed and a client is available.
If not, run `integrate-node`, `-react`, or `-nextjs` first.

## 1. Find the existing SegOps client

Look for how the app already talks to SegOps so new calls match:

```bash
# server singleton, React hooks, or a raw client
grep -rEn "useSegOps|new SegOpsClient|@segops/sdk" --include=*.ts --include=*.tsx --include=*.js src 2>/dev/null | head
```

- **Server:** a shared `segops` instance (see `integrate-node`).
- **React/Next:** the `useSegOps()` hook inside a component.

If there are several, prefer tracking **server-side** when the action is
verifiable on the backend (purchases, signups) — it's tamper-resistant. Track
client-side for pure UI interactions (clicks, views).

## 2. Design the canonical event

Decide three things and write them down:

- **`eventType`** — snake_case, past-tense verb phrase. Match the vocabulary
  already in the codebase. Common shapes:
  `page_viewed`, `product_viewed`, `add_to_cart`, `checkout_started`,
  `order_placed`, `signup_completed`, `trial_started`, `subscription_upgraded`,
  `feature_used`.
- **`userId`** — the stable identifier you key users by everywhere else
  (DB id, not email if emails change). Use `'anonymous'` (or the anonymous id)
  for pre-login actions.
- **`payload`** — flat, typed, low-cardinality keys. Include the dimensions
  you'll want to segment on later. Keep names consistent across events
  (`currency`, `value`, `plan`, `source`), prefer numbers/booleans/short
  strings, and **never** put secrets or full PII in the payload.

Example contract for "checkout completed":

```jsonc
{
  "eventType": "order_placed",
  "userId": "<stable user id>",
  "payload": {
    "order_id": "string",
    "value": 0,            // number, in `currency`
    "currency": "EUR",
    "item_count": 0,
    "coupon": "string|null"
  }
}
```

Reuse an existing `eventType` if one already fits — divergent names fragment
segments.

## 3. Wire the emit call(s)

Add `track()` at the point the action is *confirmed*, not merely attempted
(e.g. after the payment succeeds, not on button click).

**Server (shared client):**

```ts
import { segops } from '../lib/segops';

segops.track({
  userId: order.userId,
  eventType: 'order_placed',
  payload: { order_id: order.id, value: order.total, currency: order.currency, item_count: order.items.length },
});
```

**React component:**

```tsx
const segops = useSegOps();
segops.track({ userId: user.id, eventType: 'order_placed', payload: { order_id, value, currency } });
```

Guidelines:

- Emit each event **once** per occurrence — watch for retries, double renders
  (React Strict Mode), and webhook redeliveries.
- Don't block the user flow on tracking; `track()` is fire-and-forget and
  batched.
- In one-off scripts, `await segops.flush()` before exit.

## 4. Verify

Trigger the action (or call the emit path directly) and confirm the event lands
in SegOps → **Event Sandbox** with the expected `eventType`, `userId`, and
payload keys. Fix any name/shape mismatches now — consistency is what makes the
event usable for segmentation later.

## 5. (Optional) register the event schema

Registering the schema lets SegOps validate incoming payloads and document the
event. Do this server-side with the published **`@segops/admin`** SDK (secret
key `sk_…`):

```ts
import { SegOpsAdmin } from '@segops/admin';
const segops = new SegOpsAdmin({
  apiKey: process.env.SEGOPS_SECRET_KEY!,         // sk_…
  baseUrl: `${process.env.SEGOPS_API_URL}/api`,   // never hardcode the endpoint
});

// Infer a schema from sample events, then register it:
const inferred = await segops.schemas.infer([
  { user_id: 'u-1', event_type: 'order_placed', payload: { order_id: 'o1', value: 42, currency: 'EUR', item_count: 2 } },
]);
await segops.schemas.create({ event_type: 'order_placed', /* properties from `inferred` */ });

// Or validate a payload against the registered schema before shipping emit code:
await segops.schemas.validate('order_placed', { order_id: 'o1', value: 42, currency: 'EUR', item_count: 2 });
```

The `admin-script` skill covers more Admin SDK tasks if you want to script
schema registration across many events.

