---
name: integrate-android
description: "Add SegOps analytics to an Android app (Kotlin). Use when a developer wants to track events from an Android app, add the SegOps Kotlin SDK, set up SegOpsClient, or capture user events on Android. Adds the Maven dependency, configures a public key + API URL, initializes a client in the Application class, and emits a test event."
argument-hint: "Optional: API base URL (e.g. https://your-stack.example)"
---

# Integrate SegOps into an Android app

Use a **public key** (`pk_…`) — safe to embed in a shipped APK because the SDK
exchanges it for a short-lived session token via the handshake. A secret key
(`sk_…`) must never ship in an app. The Kotlin SDK is on **Maven Central** as
`io.github.segops:segops-kotlin`.

## 1. Detect the project

Look for `settings.gradle(.kts)` and an app module with `build.gradle(.kts)`
applying `com.android.application`. Note the `Application` subclass (if any) from
`AndroidManifest.xml`'s `android:name`.

## 2. Add the dependency

Ensure `mavenCentral()` is in the repositories, then add to the **app module**'s
`build.gradle.kts`:

```kotlin
dependencies {
    implementation("io.github.segops:segops-kotlin:0.1.0")
}
```

The SDK uses coroutines + OkHttp (pulled in transitively).

## 3. Permissions + config (no hardcoded endpoint)

`AndroidManifest.xml` needs internet access:

```xml
<uses-permission android:name="android.permission.INTERNET" />
```

Keep the endpoint out of source — expose it via `BuildConfig` from
`local.properties`/`gradle.properties`. In the app module `build.gradle.kts`:

```kotlin
android {
    buildFeatures { buildConfig = true }
    defaultConfig {
        buildConfigField("String", "SEGOPS_API_URL", "\"${project.findProperty("segopsApiUrl") ?: "https://your-segops-stack.example"}\"")
        buildConfigField("String", "SEGOPS_PUBLIC_KEY", "\"${project.findProperty("segopsPublicKey") ?: ""}\"")
    }
}
```

Then in `gradle.properties` (or `local.properties`, gitignored):

```
segopsApiUrl=https://your-segops-stack.example
segopsPublicKey=pk_xxx
```

Mint a `pk_` key in SegOps → **Settings → API Keys**.

## 4. Initialize in the Application class

Copy `assets/SegOpsApp.kt` (or merge into your existing `Application`). Register
it in the manifest if it isn't already:

```xml
<application android:name=".SegOpsApp" ...>
```

`SegOpsApp` builds a process-wide `SegOpsClient` from `BuildConfig` and reads the
current identity via `userProvider`.

## 5. Track events

```kotlin
SegOpsApp.client.track(SegOpsEvent(
    userId = "u-123",
    eventType = "screen_viewed",
    payload = mapOf("screen" to "home"),
))

// Identify a user (sets traits via a context_identified event):
SegOpsApp.client.identify(SegOpsContext(userId = "u-123", traits = mapOf("plan" to "pro")))
```

To bind events to a logged-in user, return a signed identity from
`userProvider`: sign `userId` on your backend (HMAC-SHA256 over
`"<userId>|<unixSeconds>"`) and pass `userIdSig` + `userIdTs` in the
`SegOpsUserContext`.

## 6. Emit a smoke-test event

Add temporarily in `onCreate`, run on an emulator/device, then remove:

```kotlin
SegOpsApp.client.track(SegOpsEvent(userId = "smoke-test", eventType = "segops_smoke_test",
                                   payload = mapOf("source" to "integrate-android")))
// flush() is a suspend fun — call from a coroutine to send immediately:
CoroutineScope(Dispatchers.IO).launch { SegOpsApp.client.flush() }
```

Confirm it lands in SegOps → **Event Sandbox** (or local ingestion logs). Call
`SegOpsApp.client.close()` (flushes + shuts down) if you ever need a clean
teardown.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `SecurityException` / no network | Missing `INTERNET` permission in the manifest. |
| `BuildConfig` unresolved | Enable `buildFeatures { buildConfig = true }` and rebuild. |
| `HTTP 401/403` on session mint | Public key wrong/disabled, or origin not allow-listed on the key. |
| Events never arrive | `SEGOPS_API_URL` unreachable from the device, or empty `pk_` key. |
| Used an `sk_` key | A secret key must not ship in an app — use the `pk_` public key. |
