# SegOps Skills Catalog

Claude Code (and other agent) skills that wire SegOps into your stack in
minutes. Each skill installs the right package, configures keys/env vars, drops
in the integration code, and emits a smoke-test event so you can confirm data is
flowing.

> **Source of truth.** These skills are authored in the SegOps monorepo under
> `skills/`. They are mirrored to the public **`segops/skills`** GitHub repo,
> from which they're installable. Keep every skill **self-contained** — no
> SegOps-internal paths or private URLs in `SKILL.md` or assets.

## Layout

One directory per skill, following the Anthropic skill format:

```
skills/
├── README.md                     # this catalog
├── <skill-name>/
│   ├── SKILL.md                  # YAML frontmatter (name, description) + instructions
│   └── assets/                   # optional templates the skill copies into a project
└── ...
```

`SKILL.md` frontmatter fields used here:

- `name` — the skill's installable name (`segops-integrate-nextjs`).
- `description` — when Claude should use it (first-person triggers + what it does).
- `argument-hint` — optional, shown to the user when invoking.

## Published skills

| Skill | Stack | What it does | SDK | Status |
|---|---|---|---|---|
| [`segops-integrate-nextjs`](./segops-integrate-nextjs) | Next.js (App + Pages Router) | `<SegOpsProvider>`, server-side user signing, page-view tracking, test event | `@segops/sdk` ≥0.2 | ✅ |
| [`segops-integrate-react`](./segops-integrate-react) | React (Vite/CRA/SPA) | `<SegOpsProvider>` + `useSegOps()`/`useUser()`, test event | `@segops/sdk` ≥0.2 | ✅ |
| [`segops-integrate-node`](./segops-integrate-node) | Node.js (server) | Singleton server client, `track`, graceful flush on shutdown | `@segops/sdk` | ✅ |
| [`segops-integrate-ios`](./segops-integrate-ios) | iOS (Swift/SwiftUI/UIKit) | Add SPM package, shared client, `pk_` handshake, test event | `sdk-swift` (SPM) | ✅ |
| [`segops-integrate-android`](./segops-integrate-android) | Android (Kotlin) | Maven dep, Application-class client, `pk_` handshake, test event | `io.github.segops:segops-kotlin` | ✅ |
| [`segops-track-event`](./segops-track-event) | Any TS/JS app | Design a canonical event, wire emit calls, optionally register the schema | `@segops/sdk` (+ `@segops/admin` for schema) | ✅ |
| [`segops-create-segment`](./segops-create-segment) | Workflow | Build a segment from a natural-language description (preview → create → compute) | `@segops/admin` | ✅ |
| [`segops-generate-landing-page`](./segops-generate-landing-page) | Workflow | Generate, build, publish, and export an AI landing page | `@segops/admin` | ✅ |
| [`segops-audit-ai-visibility`](./segops-audit-ai-visibility) | Workflow | Simulate/run AI-reach queries and summarize visibility | `@segops/admin` | ✅ |
| [`segops-admin-script`](./segops-admin-script) | Workflow | Scaffold a one-off Admin SDK script (CSV import, recompute, export) | `@segops/admin` | ✅ |
| [`segops-shopify-install`](./segops-shopify-install) | Shopify | Install + connect the SegOps Shopify app (one-click) | — (native app) | ✅ |

## Configuration is never hardcoded

Every skill reads the API base URL from configuration the developer controls —
never a baked-in hosted endpoint — so the same integration works against a local
stack, staging, or production once DNS is live. Web/server skills use env vars;
mobile skills use the platform's build config (iOS Info.plist / xcconfig,
Android `BuildConfig` from `gradle.properties`).

| Variable | Where | Example |
|---|---|---|
| `SEGOPS_API_URL` | server | `http://localhost:8000` or your SegOps API URL |
| `NEXT_PUBLIC_SEGOPS_API_URL` | browser | same value, exposed to the client |
| `SEGOPS_SECRET_KEY` | server only | `sk_…` |
| `NEXT_PUBLIC_SEGOPS_PUBLIC_KEY` | browser | `pk_…` |
| `SEGOPS_HMAC_SECRET` | server only | the public key's HMAC secret (shown once) |
| `SEGOPS_API_URL` / `SEGOPS_PUBLIC_KEY` | iOS Info.plist | API URL + `pk_…` |
| `SEGOPS_API_URL` / `SEGOPS_PUBLIC_KEY` | Android BuildConfig | API URL + `pk_…` |

## Roadmap (not yet in this catalog)

Genuinely blocked until upstream work ships:

- `segops-integrate-django` — needs the Python ingestion SDK (not yet on PyPI)
- `segops-mcp-setup` — needs the SegOps MCP server (M28)

Catalog-level follow-ups:

- Smoke-test CI (spin up a fresh project per stack, assert an event lands)
- Skill discovery / marketplace registration + a quick-start docs page
