---
name: admin-script
description: "Write a one-off SegOps Admin SDK script — CSV product import, segment recompute, data export, bulk operations, account automation. Use when a developer wants to script SegOps, automate an admin task, import a CSV, recompute segments, export members, or run a maintenance job against their workspace. Scaffolds a Node/TS script around the published @segops/admin SDK."
argument-hint: "What the script should do, e.g. \"import products.csv\" or \"recompute all segments\""
---

# Write a SegOps Admin SDK script

Scaffold a small, safe one-off script against **`@segops/admin`** for
maintenance/automation tasks. Figure out which resource the task maps to, write
the script, dry-run it, then run for real.

**Prerequisite:** a server-side **secret key** (`sk_…`). The Admin SDK rejects
public (`pk_`) and MCP (`mk_`) keys.

## 1. Install + configure

```bash
npm install @segops/admin
```

```bash
SEGOPS_API_URL=http://localhost:8000   # your SegOps API base URL
SEGOPS_SECRET_KEY=sk_xxx
```

Start from `assets/admin-script.ts` — it wires the client from env (no
hardcoded endpoint) and leaves a `main()` to fill in:

```ts
import { SegOpsAdmin } from '@segops/admin';
const segops = new SegOpsAdmin({
  apiKey: process.env.SEGOPS_SECRET_KEY!,
  baseUrl: `${process.env.SEGOPS_API_URL}/api`,
});
```

Run with `npx tsx admin-script.ts` (or compile with your toolchain).

## 2. Map the task to a resource

| Task | Resource call |
|---|---|
| Import a product CSV | `segops.products.importCsv(file)` → `importStatus(jobId)` → `confirmImport(jobId, …)` |
| Bulk upsert products by SKU | `segops.products.bulkUpsert(rows)` |
| Re-score products for AI readability | `segops.products.scoreAll()` |
| Recompute one / many segments | `segops.segments.recompute(id)` (loop `segops.segments.iterate()`) |
| Export segment members | `segops.segments.export(id, { format: 'csv' })` → poll the job |
| List / page through any collection | `for await (const x of segops.segments.iterate()) { … }` |
| Look up a user's segments/events | `segops.users.segments(userId)` / `segops.users.events(userId)` |
| Register / validate an event schema | `segops.schemas.create(…)` / `segops.schemas.validate(type, payload)` |
| Sync an activation | `segops.activations.sync(id)` |
| Read account analytics | `segops.analytics.overview()` / `.usage()` |

Anything not wrapped: use the escape hatch `segops.http.request(method, path, { body })`.

## 3. Common recipes

**Recompute every segment:**

```ts
for await (const s of segops.segments.iterate()) {
  await segops.segments.recompute(s.id);
  console.log('recompute →', s.name);
}
```

**Import a product CSV (Node):**

```ts
import { readFile } from 'node:fs/promises';
const buf = await readFile('products.csv');
const job = await segops.products.importCsv(new Blob([buf]), 'products.csv');
// poll segops.products.importStatus(job.id) until ready, then confirmImport(...)
```

**Export segment members to a download URL:**

```ts
const job = await segops.segments.export(segmentId, { format: 'csv' });
// poll segops.segments? export jobs surface a download_url when status is ready
```

## 4. Safety

- **Dry-run first.** For destructive/bulk actions (`delete`, `bulkUpsert`,
  `scoreAll`), log what *would* change before the write, or run against a
  staging `SEGOPS_API_URL`.
- Writes are **idempotent** where the SDK marks them so (create/recompute/sync)
  — safe to retry — but `delete` is not reversible.
- Paginate with `iterate()` rather than a huge `list({ limit })`.
- Errors throw `SegOpsApiError` (has `.status`); wrap `main()` in try/catch and
  exit non-zero on failure.

## 5. Verify

Re-read the affected resource (`get`/`list`) or check the SegOps dashboard.
Async jobs (imports, exports, recomputes) complete in the background — poll the
job/resource status rather than assuming immediate completion.
