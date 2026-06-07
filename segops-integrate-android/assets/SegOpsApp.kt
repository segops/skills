package com.example.app // TODO: set to your app's package

import android.app.Application
import io.github.segops.SegOpsClient
import io.github.segops.SegOpsOptions
import io.github.segops.SegOpsUserContext
import java.util.UUID

/**
 * Application that owns a process-wide SegOps client.
 *
 * Reads the endpoint + public key from BuildConfig (set via gradle.properties),
 * so nothing is hardcoded. Register in AndroidManifest.xml:
 *   <application android:name=".SegOpsApp" ...>
 */
class SegOpsApp : Application() {

    override fun onCreate() {
        super.onCreate()
        instance = this
        client = SegOpsClient(
            SegOpsOptions(
                apiUrl = BuildConfig.SEGOPS_API_URL,
                apiKey = BuildConfig.SEGOPS_PUBLIC_KEY, // pk_… — drives the session handshake
                userProvider = { currentUserContext() },
            )
        )
    }

    /** Return the current identity for the handshake. Sign userId on your backend
     *  and supply userIdSig + userIdTs for logged-in users; anonymous otherwise. */
    private fun currentUserContext(): SegOpsUserContext {
        // TODO: wire to your auth/session.
        // Logged in: return SegOpsUserContext(userId = user.id, userIdSig = sig, userIdTs = ts)
        return SegOpsUserContext(anonymousId = anonymousId())
    }

    private fun anonymousId(): String {
        val prefs = getSharedPreferences("segops", MODE_PRIVATE)
        return prefs.getString("anonymous_id", null) ?: UUID.randomUUID().toString().also {
            prefs.edit().putString("anonymous_id", it).apply()
        }
    }

    companion object {
        lateinit var instance: SegOpsApp
            private set
        lateinit var client: SegOpsClient
            private set
    }
}
