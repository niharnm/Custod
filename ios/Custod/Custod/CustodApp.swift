import SwiftUI

// Custod for iOS. Like the macOS app and the extension, it's account-first: the
// app is gated behind sign-in, so the very first thing on a fresh install is the
// login screen (Grammarly-style). Once signed in, the session is kept in the
// Keychain and restored on launch, so the user stays signed in.
@main
struct CustodApp: App {
    @StateObject private var auth = AuthStore()

    var body: some Scene {
        WindowGroup {
            Group {
                if auth.isSignedIn {
                    ContentView()
                } else {
                    SignInView()
                }
            }
            .environmentObject(auth)
            .animation(.default, value: auth.isSignedIn)
        }
    }
}
