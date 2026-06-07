---
name: segops-integrate-react
description: "Add SegOps analytics to a React app (Vite, CRA, or any SPA). Use when a developer wants to track events from a React frontend, add SegOps to a React/Vite app, set up the SegOpsProvider or useSegOps/useUser hooks, or asks how to capture user events in React. Installs @segops/sdk, wires the public key + API URL from env, mounts <SegOpsProvider>, and emits a test event."
argument-hint: "Optional: API base URL (e.g. http://localhost:8000)"
---

# Integrate SegOps into a React app

Use the **public key** (`pk_…`) in the browser. It can't write directly — the
SDK exchanges it for a short-lived session token, so it's safe to ship to the
client. `<SegOpsProvider>` and the `useSegOps()` / `useUser()` hooks come from
`@segops/sdk/react`.

> For **Next.js**, use `segops-integrate-react`'s sibling skill
> `segops-integrate-nextjs` instead — it handles the App/Pages Router split and
> server-side user signing.
>
> **Catalog note:** ships in the public `segops/skills` catalog (M29).

## 1. Detect the project

```bash
test -f package.json && grep -q '"react"' package.json && echo "React project found" || echo "No React project here"
```

Note the bundler (Vite → `vite.config.*`, CRA → `react-scripts`) — it determines
the env-var prefix in Step 3.

## 2. Install the SDK

```bash
npm install @segops/sdk      # needs @segops/sdk ≥ 0.2 for the /react entry
```

`react` is an optional peer dependency — already satisfied by the app.

## 3. Configure env vars

Only the **public** key and API URL go in the browser. Use your bundler's
public-env prefix:

- **Vite:** `VITE_SEGOPS_API_URL`, `VITE_SEGOPS_PUBLIC_KEY`
- **CRA:** `REACT_APP_SEGOPS_API_URL`, `REACT_APP_SEGOPS_PUBLIC_KEY`

```bash
# .env (Vite example) — never put an sk_ secret key here
VITE_SEGOPS_API_URL=http://localhost:8000
VITE_SEGOPS_PUBLIC_KEY=pk_xxx
```

Mint a `pk_` key in SegOps → **Settings → API Keys**. Add these to
`.env.example`; confirm `.env` is gitignored.

## 4. Mount the provider

Wrap the app root once. Read config from env (see `assets/SegOpsRoot.tsx` for a
Vite example — adjust the env accessor for CRA):

```tsx
import { SegOpsProvider } from '@segops/sdk/react';

createRoot(document.getElementById('root')!).render(
  <SegOpsProvider
    apiUrl={import.meta.env.VITE_SEGOPS_API_URL}
    apiKey={import.meta.env.VITE_SEGOPS_PUBLIC_KEY}
  >
    <App />
  </SegOpsProvider>,
);
```

## 5. Track from components

```tsx
import { useSegOps, useUser } from '@segops/sdk/react';

function BuyButton() {
  const segops = useSegOps();
  const { user } = useUser();
  return (
    <button onClick={() => segops.track({
      userId: user?.userId ?? 'anonymous',
      eventType: 'checkout_started',
    })}>
      Buy
    </button>
  );
}
```

After login, bind events to the user (sign the id on your backend first — see
the `segops-integrate-node` skill or `@segops/sdk/server`'s `signUserId`):

```tsx
const { setUser } = useUser();
setUser({ userId: signed.user_id, userIdSig: signed.user_id_sig, userIdTs: signed.user_id_ts });
```

To auto-capture page views in a routed app, call `segops.trackPageView()` on
route change.

## 6. Emit a smoke-test event

Drop `assets/SegOpsSmokeTest.tsx` in temporarily and render it inside the
provider — it fires one event on mount and logs the result. Confirm it appears
in SegOps → **Event Sandbox** (or local ingestion logs), then remove it.

## Troubleshooting

| Symptom | Fix |
|---|---|
| Console warns about an `sk_` key in the browser | You used a secret key — replace with the `pk_` public key. |
| `useSegOps must be used inside <SegOpsProvider>` | A component is rendered outside the provider — move the provider higher. |
| Session mint fails (401/403) | Public key wrong, disabled, or the origin isn't allow-listed on the key. |
| `import.meta.env` undefined | Wrong bundler prefix — Vite uses `VITE_`, CRA uses `REACT_APP_`. |
