# SegOps Skills for Claude Code

A Claude Code plugin that adds [SegOps](https://segops.ai) to your app in
minutes. Each skill installs the right SDK, configures your keys, drops in the
integration code, and emits a test event — so you go from nothing to your first
event fast. Workflow skills also drive the SegOps Admin SDK to build segments,
generate AI landing pages, and audit AI visibility.

## Install

### Plugin (recommended)

```
/plugin marketplace add segops/skills
/plugin install segops@segops
```

Skills are namespaced as `/segops:<name>` (e.g. `/segops:integrate-nextjs`), and
Claude invokes the right one automatically when your request matches.

### Just one skill

Each skill is a plain `SKILL.md` directory, so you can copy a single one into
your personal (`~/.claude/skills/`) or project (`.claude/skills/`) folder:

```bash
git clone https://github.com/segops/skills.git
cp -r skills/plugins/segops/skills/integrate-nextjs ~/.claude/skills/
```

It's then available as `/integrate-nextjs`.

## Before you start

You'll need a SegOps workspace and an API key from **Settings → API Keys**:

- a **public key** (`pk_…`) for browser and mobile apps (safe to ship), and/or
- a **secret key** (`sk_…`) for server-side code (never ship this to a client).

You also point the skill at your SegOps **API base URL** — the skills read it
from configuration you control and never hardcode an endpoint, so the same setup
works in local, staging, and production.

## Skills

| Skill | Use it to… |
|---|---|
| [`integrate-nextjs`](./plugins/segops/skills/integrate-nextjs) | Add SegOps to a Next.js app (App + Pages Router): provider, server-side user signing, page-view tracking |
| [`integrate-react`](./plugins/segops/skills/integrate-react) | Add SegOps to a React app (Vite/CRA): `<SegOpsProvider>` + `useSegOps()` / `useUser()` |
| [`integrate-node`](./plugins/segops/skills/integrate-node) | Track events from a Node.js server with graceful flush on shutdown |
| [`integrate-ios`](./plugins/segops/skills/integrate-ios) | Add the SegOps Swift SDK to an iOS app (SwiftUI/UIKit) |
| [`integrate-android`](./plugins/segops/skills/integrate-android) | Add the SegOps Kotlin SDK to an Android app |
| [`track-event`](./plugins/segops/skills/track-event) | Design a canonical event, wire the emit calls, and optionally register its schema |
| [`create-segment`](./plugins/segops/skills/create-segment) | Build a segment from a natural-language description (preview → create → compute) |
| [`generate-landing-page`](./plugins/segops/skills/generate-landing-page) | Generate, build, publish, and export an AI landing page |
| [`audit-ai-visibility`](./plugins/segops/skills/audit-ai-visibility) | Check how a brand shows up in AI assistant answers and summarize the gaps |
| [`admin-script`](./plugins/segops/skills/admin-script) | Scaffold a one-off Admin SDK script (CSV import, segment recompute, export) |
| [`shopify-install`](./plugins/segops/skills/shopify-install) | Install and connect the SegOps Shopify app to a store |

The integration skills use the public-key handshake in the browser/mobile and a
secret key on the server; the workflow skills use a server-side secret key via
the Admin SDK.

## Coming soon

- **Django** integration
- **MCP** server setup

## Repository layout

```
.claude-plugin/
└── marketplace.json            # registers the `segops` plugin
plugins/
└── segops/
    ├── .claude-plugin/
    │   └── plugin.json
    └── skills/
        ├── integrate-nextjs/
        │   ├── SKILL.md
        │   └── assets/
        └── …
```

## Links

- SegOps docs: https://segops.ai/docs
- Issues & contributions: https://github.com/segops/skills

MIT licensed.
