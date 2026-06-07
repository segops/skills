---
name: segops-integrate-ios
description: "Add SegOps analytics to an iOS app (Swift / SwiftUI / UIKit). Use when a developer wants to track events from an iOS app, add the SegOps Swift SDK, set up SegOpsClient, or capture user events on iOS. Adds the SegOps Swift Package, configures a public key + API URL, drops in a shared client, and emits a test event."
argument-hint: "Optional: API base URL (e.g. https://your-stack.example)"
---

# Integrate SegOps into an iOS app

Use a **public key** (`pk_…`) — it's safe to embed in a shipped binary because
the SDK exchanges it for a short-lived session token via the handshake. A secret
key (`sk_…`) must never ship in an app. The Swift SDK is distributed via **Swift
Package Manager**.

> **Catalog note:** ships in the public `segops/skills` catalog (M29). Keep it
> self-contained.

## 1. Detect the project

Look for an Xcode project/workspace (`*.xcodeproj` / `*.xcworkspace`) or a
`Package.swift`. Note whether the UI is SwiftUI (`@main struct …: App`) or UIKit
(`AppDelegate`) — it determines where the client is initialized (Step 4).

## 2. Add the Swift Package

**Xcode:** File → Add Package Dependencies → enter
`https://github.com/segops/sdk-swift` → add the **SegOps** product to the app
target.

**Or in `Package.swift`:**

```swift
dependencies: [
    .package(url: "https://github.com/segops/sdk-swift", from: "0.1.0"),
],
targets: [
    .target(name: "YourApp", dependencies: [.product(name: "SegOps", package: "sdk-swift")]),
]
```

## 3. Configure the key + API URL (no hardcoded endpoint)

Don't bake an endpoint into source. Add two keys to **Info.plist** so each build
config can point at the right stack (local / staging / prod once DNS is live):

```xml
<key>SEGOPS_API_URL</key>
<string>https://your-segops-stack.example</string>
<key>SEGOPS_PUBLIC_KEY</key>
<string>pk_xxx</string>
```

Mint a `pk_` key in SegOps → **Settings → API Keys**. (For per-environment
values, drive these from an `.xcconfig`.)

## 4. Add a shared client

Copy `assets/SegOps.swift` into the app. It reads the Info.plist config and
exposes a shared `SegOpsClient`. Initialize it once at launch:

**SwiftUI:**

```swift
@main
struct YourApp: App {
    init() { _ = SegOps.shared } // construct the client at launch
    var body: some Scene { WindowGroup { ContentView() } }
}
```

**UIKit** — in `application(_:didFinishLaunchingWithOptions:)`: `_ = SegOps.shared`.

## 5. Track events

```swift
SegOps.shared.track(SegOpsEvent(userId: "u-123", eventType: "screen_viewed",
                                payload: ["screen": "home"]))

// Identify a user (sets traits via a context_identified event):
SegOps.shared.identify(SegOpsContext(userId: "u-123", traits: ["plan": "pro"]))
```

To bind events to a logged-in user, return a signed identity from the client's
`userProvider` (see `assets/SegOps.swift`). Sign `userId` on your backend
(HMAC-SHA256 over `"<userId>|<unixSeconds>"`) and pass `userIdSig` + `userIdTs`
in the `SegOpsUserContext`.

## 6. Emit a smoke-test event

Add this temporarily at launch, run on a simulator/device, then remove it:

```swift
SegOps.shared.track(SegOpsEvent(userId: "smoke-test", eventType: "segops_smoke_test",
                                payload: ["source": "segops-integrate-ios"]))
SegOps.shared.flush() // send immediately instead of waiting for the batch timer
```

Confirm it lands in SegOps → **Event Sandbox** (or your local ingestion logs).
The SDK also auto-flushes when the app enters the background.

## Troubleshooting

| Symptom | Fix |
|---|---|
| Events never arrive | Check `SEGOPS_API_URL` resolves from the device and the stack is reachable. |
| `HTTP 401/403` on session mint | Public key wrong/disabled, or the app's identity isn't allow-listed on the key. |
| Using `sk_` by mistake | A secret key must not ship in an app — use the `pk_` public key. |
| Config nil at runtime | The Info.plist keys are missing for that build configuration. |
