---
name: segops-integrate-nextjs
description: "Add SegOps analytics to a Next.js app (App Router or Pages Router). Use when a developer wants to track events in Next.js, add SegOps to a Next app, set up the SegOpsProvider with server-side user signing, capture page views, or asks how to wire SegOps into Next.js. Installs @segops/sdk, wires public + secret keys from env, drops in a client provider and a signing route, and emits a test event."
argument-hint: "Optional: API base URL (e.g. http://localhost:8000)"
---

# Integrate SegOps into Next.js

The browser uses the **public key** (`pk_…`) + the session handshake; identity
is made trustworthy by **signing the user id on the server** with the public
key's HMAC secret (the secret never reaches the client). This skill wires both
halves and supports the **App Router** and the **Pages Router**.

> **Catalog note:** ships in the public `segops/skills` catalog (M29). Keep it
> self-contained.

## 1. Detect the project & router

```bash
test -f package.json && grep -q '"next"' package.json && echo "Next.js found"
test -d app && echo "App Router (app/)"
test -d pages && echo "Pages Router (pages/)"
```

A project can have both; integrate whichever the app actually uses for its root
layout.

## 2. Install the SDK

```bash
npm install @segops/sdk      # needs @segops/sdk ≥ 0.2 for the /react entry
```

## 3. Configure env vars

Copy `assets/env.example` into `.env.local`. Public values are browser-exposed
(`NEXT_PUBLIC_`); the HMAC secret is **server-only**.

```bash
NEXT_PUBLIC_SEGOPS_API_URL=http://localhost:8000   # your SegOps API base URL
NEXT_PUBLIC_SEGOPS_PUBLIC_KEY=pk_xxx               # browser-safe public key
SEGOPS_HMAC_SECRET=xxxxxxxx                         # public key's HMAC secret — server only
```

Mint a `pk_` key in SegOps → **Settings → API Keys** and enable
**"require signed user_id"** so forged identities are rejected. Copy the HMAC
secret shown once at creation. Confirm `.env.local` is gitignored.

## 4. Add the client provider

Copy `assets/segops-provider.tsx` into your app (e.g.
`app/segops-provider.tsx`). It's a Client Component (`'use client'`) that mounts
`<SegOpsProvider>` from `@segops/sdk/react` and reads config from
`NEXT_PUBLIC_*` env.

**App Router** — wrap `children` in `app/layout.tsx`:

```tsx
import { SegOpsProvider } from './segops-provider';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SegOpsProvider>{children}</SegOpsProvider>
      </body>
    </html>
  );
}
```

**Pages Router** — wrap in `pages/_app.tsx`:

```tsx
import { SegOpsProvider } from '../components/segops-provider';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <SegOpsProvider>
      <Component {...pageProps} />
    </SegOpsProvider>
  );
}
```

## 5. Add the server-side signing endpoint

To bind events to a logged-in user, the browser needs a signed identity. Copy
the route for your router (it calls `signUserId` from `@segops/sdk/server` with
the server-only HMAC secret):

- **App Router:** `assets/app-router-sign-route.ts` → `app/api/segops/sign/route.ts`
- **Pages Router:** `assets/pages-router-sign-api.ts` → `pages/api/segops/sign.ts`

**Replace the placeholder auth** in the handler with your real session lookup —
the endpoint must sign only the *authenticated* user's id, never an id from the
request body. After login, the client fetches its signature and calls
`setUser(...)`:

```tsx
'use client';
import { useUser } from '@segops/sdk/react';

const { setUser } = useUser();
const signed = await fetch('/api/segops/sign').then((r) => r.json());
setUser({ userId: signed.user_id, userIdSig: signed.user_id_sig, userIdTs: signed.user_id_ts });
```

## 6. Track events & page views

```tsx
'use client';
import { useSegOps } from '@segops/sdk/react';

const segops = useSegOps();
segops.track({ userId: 'anonymous', eventType: 'cta_clicked', payload: { id: 'hero' } });
```

For automatic page views in the App Router, call `segops.trackPageView()` from a
small client component that watches `usePathname()`.

## 7. Emit a smoke-test event

The provider auto-fires nothing on its own. Confirm the pipe works by adding a
temporary effect (or a button) that calls
`segops.track({ userId: 'smoke-test', eventType: 'segops_smoke_test' })` and
then `segops.flush()`. Load the page and check SegOps → **Event Sandbox** (or
local ingestion logs). Remove the temporary code once you see the event.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `useSegOps must be used inside <SegOpsProvider>` | The provider isn't wrapping that subtree, or it's a Server Component — only Client Components can call the hooks. |
| Browser warns about an `sk_` key | You used a secret key in `NEXT_PUBLIC_*` — use the `pk_` public key in the browser. |
| Events have no `user_id` / show anonymous | The signing route isn't wired, or `setUser` wasn't called after login. |
| Signing route 500s | `SEGOPS_HMAC_SECRET` missing/wrong, or it leaked into a `NEXT_PUBLIC_` var. |
| Session mint 403 | The page's origin isn't allow-listed on the public key. |
