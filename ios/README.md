# Custod for iOS

A SwiftUI iPhone/iPad app that joins the Custod ecosystem. Like the macOS app
and the browser extension, it is **account-first**: the very first screen on a
fresh install is the login gate, and nothing is shown until you sign in — the
Grammarly model you asked for.

Signing in authenticates against the **same Supabase project** as the website,
the macOS app, and the extension (`CustodConfig.swift`), so your iPhone resolves
to the same account/email everywhere. The session is stored in the Keychain and
restored on launch, so you stay signed in.

## Run it

```bash
open ios/Custod/Custod.xcodeproj
# pick an iPhone simulator, press ⌘R
```

Or from the CLI:

```bash
cd ios/Custod
xcodebuild -project Custod.xcodeproj -scheme Custod \
  -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' \
  build CODE_SIGNING_ALLOWED=NO
```

The project uses an Xcode 16+/objectVersion-77 *synchronized file group*, so any
`.swift` file dropped into `Custod/` is picked up automatically — no need to edit
the project file.

## What's implemented

- **Login gate** (`CustodApp.swift` → `SignInView` / `ContentView`)
- **Auth** (`AuthStore.swift`): email/password, sign-up, and Continue with Google
  (`ASWebAuthenticationSession`), shared Supabase account, Keychain-persisted
  session with transparent token refresh.

## What's next: Screen Time on iOS

iOS does **not** allow reading per-app usage the way macOS does (there's no
`knowledgeC.db` access). The supported path is Apple's **Screen Time API**:

- Frameworks: `FamilyControls`, `DeviceActivity`, `ManagedSettings`.
- Requires the **`com.apple.developer.family-controls`** entitlement, which must
  be **requested from and approved by Apple** for the app's bundle id
  (`app.custod.ios`) — it is not enabled by default and is gated on distribution.
- Flow: request `AuthorizationCenter.shared.requestAuthorization(for: .individual)`,
  then use a `DeviceActivityReport` extension to surface usage. Usage data is
  only available inside that report extension (privacy-preserving), so the
  dashboard reads it from there rather than directly.

Until the entitlement is granted, `ContentView` shows the account and a "Screen
Time — on the way" card so the ecosystem login works end-to-end today.

## Google sign-in note

For "Continue with Google" to complete, Supabase must allow `custod://auth-callback`
in its redirect URL list (same requirement as the macOS app — see
`docs/AUTH_SETUP.md`).
