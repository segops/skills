---
name: segops-create-segment
description: "Build a SegOps user segment from a natural-language description. Use when a developer or marketer wants to create a segment, define an audience, translate a description like 'big spenders who went quiet' into segment rules, or build a behavioral cohort in SegOps. Uses the published @segops/admin SDK to preview, create, and compute the segment."
argument-hint: "Describe the audience, e.g. \"spent over €500 but no order in 30 days\""
---

# Create a SegOps segment from a description

Translate a plain-language audience description into the SegOps segment DSL,
preview it, then create and compute it with the **`@segops/admin`** SDK.

**Prerequisite:** a server-side **secret key** (`sk_…`) — the Admin SDK rejects
public/MCP keys. Run this where the key is safe (a script/terminal, not the
browser).

> **Catalog note:** ships in the public `segops/skills` catalog (M29). Keep it
> self-contained.

## 1. Install the Admin SDK

```bash
npm install @segops/admin
```

## 2. Configure key + API URL

Read both from env — never hardcode a hosted endpoint. The Admin SDK's
`baseUrl` includes the `/api` prefix.

```bash
SEGOPS_API_URL=http://localhost:8000   # your SegOps API base URL
SEGOPS_SECRET_KEY=sk_xxx               # secret key — keep off the client
```

```ts
import { SegOpsAdmin } from '@segops/admin';

const segops = new SegOpsAdmin({
  apiKey: process.env.SEGOPS_SECRET_KEY!,
  baseUrl: `${process.env.SEGOPS_API_URL}/api`,
});
```

## 3. Translate the description into the DSL

A segment `definition` is `{ logic: 'AND' | 'OR', conditions: [...] }`. Pick the
condition `type` that fits each clause:

| Type | Use for | Key fields |
|---|---|---|
| `event_count` | "did X at least N times" | `event_type`, `operator`, `value` |
| `recency` | "(no) activity in last N days" | `event_type`, `operator`, `window_days` |
| `monetary` | "spent / value over N" | `event_type`, `property`, `metric` (`sum`/`avg`/`max`), `operator`, `value` |
| `event_property` | "latest value of a property" | `event_type`, `property`, `operator`, `value` |
| `user_property` | "trait from `context_identified`" | `property`, `operator`, `value` |
| `event_sequence` | "did A then B within a window" | `events`, `window_days` |
| `segment_membership` | "is / isn't in another segment" | `segment_id`, `operator` |

Operators: `eq neq gt gte lt lte between not_between in not_in contains
does_not_contain starts_with ends_with matches_regex is_set is_not_set is_true
is_false`.

Example — *"spent over €500 total but no order in the last 30 days"*:

```ts
const definition = {
  logic: 'AND',
  conditions: [
    { type: 'monetary', event_type: 'order_placed', property: 'total', metric: 'sum', operator: 'gte', value: 500 },
    { type: 'recency',  event_type: 'order_placed', operator: 'gt', window_days: 30 },
  ],
};
```

Match `event_type` and `property` names to what the app actually emits (check
with the `segops-track-event` skill or the schema registry if unsure).

## 4. Preview before persisting

```ts
const preview = await segops.segments.preview(definition);
console.log(preview); // { matched_users, sample_user_ids, sql }
```

Show the matched count and a sample to the user and confirm it looks right. If
it's empty or huge, revise the conditions and preview again.

## 5. Create and compute

```ts
const segment = await segops.segments.create({
  name: 'High-value lapsed',
  description: 'Spent ≥ €500 total, no order in 30 days',
  segment_type: 'rule',
  definition,
});

await segops.segments.recompute(segment.id); // full membership compute
```

(`segment_type` is `rule`, `ai`, or `lookalike`.)

## 6. Verify

```ts
const fresh = await segops.segments.get(segment.id);
console.log(fresh.member_count, fresh.last_computed_at);
```

Or open the segment in the SegOps dashboard. Membership computes asynchronously —
`member_count` populates once the recompute finishes.

## Next steps

- **Activate it:** push the segment to a destination with the `activations`
  resource (`segops.activations.create(...)` → `.sync(id)`).
- **Who's in it:** `segops.segments.members(id)` or, for one user,
  `segops.users.segments(userId)`.
