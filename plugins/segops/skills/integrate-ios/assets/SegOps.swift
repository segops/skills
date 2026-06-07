import Foundation
import SegOps

/// Shared SegOps client for the app.
///
/// Reads `SEGOPS_API_URL` and `SEGOPS_PUBLIC_KEY` (pk_…) from Info.plist so the
/// endpoint is never hardcoded. Construct once at launch: `_ = SegOps.shared`.
enum SegOps {
    static let shared: SegOpsClient = {
        let info = Bundle.main.infoDictionary
        guard
            let urlString = info?["SEGOPS_API_URL"] as? String,
            let url = URL(string: urlString),
            let apiKey = info?["SEGOPS_PUBLIC_KEY"] as? String
        else {
            fatalError("SegOps: set SEGOPS_API_URL and SEGOPS_PUBLIC_KEY in Info.plist")
        }

        return SegOpsClient(options: .init(
            apiURL: url,
            apiKey: apiKey, // pk_… — safe to ship; drives the session handshake
            userProvider: { currentUserContext() }
        ))
    }()
}

/// Return the current identity for the session handshake. Sign `userId` on your
/// backend and supply `userIdSig` + `userIdTs` for logged-in users; return an
/// anonymous context otherwise.
private func currentUserContext() -> SegOpsUserContext {
    // TODO: wire to your auth/session.
    // Logged in:
    //   return SegOpsUserContext(userId: user.id, userIdSig: sig, userIdTs: ts)
    // Anonymous:
    return SegOpsUserContext(anonymousId: deviceAnonymousId())
}

/// Stable per-install anonymous id (persisted in UserDefaults).
private func deviceAnonymousId() -> String {
    let key = "segops_anonymous_id"
    if let existing = UserDefaults.standard.string(forKey: key) { return existing }
    let fresh = UUID().uuidString
    UserDefaults.standard.set(fresh, forKey: key)
    return fresh
}
