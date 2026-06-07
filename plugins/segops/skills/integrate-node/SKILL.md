---
name: integrate-node
description: "Add SegOps server-side event tracking to a Node.js app. Use when a developer wants to track events from a Node/Express/Fastify/NestJS backend, send server-side analytics to SegOps, install @segops/sdk on a server, or asks how to emit events from Node. Installs @segops/sdk, wires the secret key + API URL from env, drops in a shared server client, and flushes on shutdown."
argument-hint: "Optional: API base URL (e.g. http://localhost:8000)"
---

# Integrate SegOps into a Node.js server

Track events server-side with a **secret key** (`sk_…`). On the server the key
authenticates directly — no handshake needed. The one rule: a secret key must
**never** reach the browser.

## 1. Detect the project

```bash
test -f package.json && echo "Node project found" || echo "No package.json — run from the project root"
```

Note the package manager (look for `package-lock.json`, `pnpm-lock.yaml`, or
`yarn.lock`) and whether the project is ESM (`"type": "module"`) or TypeScript.

## 2. Install the SDK

```bash
npm install @segops/sdk      # or: pnpm add / yarn add
```

## 3. Configure env vars

Add to `.env` (and `.env.example`). **Do not commit real keys.** Ask the user
for their API URL and secret key, or point them at SegOps → **Settings → API
Keys** to mint an `sk_` key.

```bash
SEGOPS_API_URL=http://localhost:8000   # your SegOps API base URL; prod once DNS is live
SEGOPS_SECRET_KEY=sk_xxx               # server-side secret — keep out of the browser
```

Confirm `.env` is gitignored.

## 4. Drop in the shared client

Copy `assets/segops.server.ts` into the project (e.g. `src/lib/segops.ts`). If
the project is plain JS, strip the types. It exports a single shared
`SegOpsClient` and a `shutdownSegOps()` helper, and reads config from env so
nothing is hardcoded.

Use it anywhere on the server:

```ts
import { segops } from './lib/segops';

segops.track({ userId: user.id, eventType: 'order_placed', payload: { total: 42, currency: 'EUR' } });
```

Events are queued and flushed in the background (batched). For a one-off script
that exits immediately, `await segops.flush()` (or `shutdownSegOps()`).

## 5. Flush on shutdown

Long-running servers should flush the queue on exit so the last events aren't
lost. `assets/segops.server.ts` registers `SIGTERM`/`SIGINT` handlers; wire it
into your framework's shutdown hook if it has one (e.g. NestJS
`onApplicationShutdown`).

## 6. Emit a smoke-test event

Run a throwaway script to confirm events land. This targets the **configured**
`SEGOPS_API_URL` — never a hardcoded endpoint.

```bash
node --env-file=.env -e "
const { SegOpsClient } = require('@segops/sdk');
const c = new SegOpsClient({ apiUrl: process.env.SEGOPS_API_URL, apiKey: process.env.SEGOPS_SECRET_KEY });
c.track({ userId: 'smoke-test', eventType: 'segops_smoke_test', payload: { source: 'integrate-node' } });
c.shutdown().then(() => console.log('✓ test event flushed to', process.env.SEGOPS_API_URL));
"
```

(For ESM/TS projects use `import` and `tsx`/`ts-node` instead of `require`.)

Then check the event arrived in SegOps → **Event Sandbox** (or your local
ingestion logs). If it doesn't appear within ~60s, see Troubleshooting.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `HTTP 401` | Wrong/expired `sk_` key, or the key belongs to a different workspace. |
| `HTTP 404` / connection refused | `SEGOPS_API_URL` is wrong or the stack isn't running. |
| Browser warning about `sk_` | A secret key leaked into client code — move tracking server-side and use the React/Next skills (`pk_`) for the browser. |
| Events never arrive | Process exited before flush — `await segops.flush()` in scripts. |
