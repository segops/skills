---
name: segops-shopify-install
description: "Install and connect the SegOps Shopify app to a store. Use when a developer or merchant wants to add SegOps to a Shopify store, connect Shopify to SegOps, set up Shopify segmentation/analytics, or asks how to install the SegOps Shopify app. Detects an existing Shopify app project, opens the install URL, and walks through scope approval and verification."
argument-hint: "Optional: shop domain (e.g. acme.myshopify.com)"
---

# Install the SegOps Shopify App

Connect a Shopify store to SegOps. The app installs in one click and
auto-provisions the workspace, webhooks, storefront pixel, product sync, and
billing — there is no manual API-key or webhook wiring to do.

> **Catalog note:** this skill ships in the public `segops/skills` catalog
> (milestone M29). Keep it self-contained — no SegOps-internal paths.

---

## 1. Figure out the situation

Determine which case applies:

- **Merchant, no code** — they just want SegOps on their store. Send them to the
  App Store install (Step 2a).
- **Developer with a Shopify app project** — there's a `shopify.app.toml` in the
  repo and they're using the Shopify CLI. They can install via `shopify app dev`
  against a dev store (Step 2b).

Check for a project:

```bash
test -f shopify.app.toml && echo "Shopify app project found" || echo "No project — use App Store install"
```

## 2a. Install from the App Store (merchants)

1. Open the SegOps listing: `https://apps.shopify.com/segops`
2. Click **Add app** and choose the store.
3. Approve the scopes when prompted (products, orders, customers, checkouts,
   inventory, fulfillments, themes — see the docs for why each is needed).
4. You'll land in the embedded SegOps admin. Setup (workspace, backfill, pixel)
   runs automatically; the dashboard shows progress.

Direct install link (substitute the shop):

```
https://api.segops.io/shopify/install?shop=<shop>.myshopify.com
```

## 2b. Install via the Shopify CLI (developers)

From the app project directory:

```bash
shopify app dev          # opens a tunnel + prompts to install on a dev store
```

Approve the scopes in the browser. The embedded admin loads on completion.

## 3. Verify it's working

- **Backfill:** the embedded admin dashboard shows backfill progress; it
  completes within minutes for a typical store.
- **Storefront events:** open the storefront, view a product or add to cart, then
  check the SegOps **Event Sandbox** — the event should appear within ~60s.
- **First segment:** SegOps auto-suggests a segment shortly after backfill.

## 4. Common next steps

- **Pixel settings** (which events, sampling): embedded admin → **Pixel**.
- **Push a segment to Shopify** (customer tag or native segment): segment detail
  → **Push to Shopify**.
- **Segment-driven discounts:** embedded admin → **Discounts**.
- **Billing / plan:** embedded admin → **Billing** (Growth & Scale include a
  30-day trial).

## Troubleshooting

| Symptom | Fix |
|---|---|
| Install URL 404s | The app must be enabled for the store; use the App Store listing. |
| Approved but no events | Backfill may still be running; storefront events need the pixel + granted analytics consent. |
| "Reapprove scopes" banner | The app updated its scopes — reapprove from the embedded admin. |

Full reference: SegOps docs → **Integrations → Shopify App**.
