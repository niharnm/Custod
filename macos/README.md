# Custod for macOS

A native SwiftUI port of the Custod web app. It runs the **same burnout
analyzer logic** locally, reads your browser tabs **natively via Apple Events**
(no Chrome extension needed), and stores history as local JSON — nothing leaves
the Mac.

## How this maps to the web app

| Web (Next.js / TS)                | macOS (SwiftUI)              | File |
| --------------------------------- | --------------------------- | ---- |
| `lib/types.ts`                    | model structs/enums         | `Custod/Models.swift` |
| `lib/analyzer.ts`                 | analyzer (1:1 port)         | `Custod/BurnoutAnalyzer.swift` |
| `lib/utils.ts` `parseTabsInput`   | manual paste parser         | `Custod/TabParsing.swift` |
| `extension/` (Chrome tab scrape)  | **native AppleScript scrape** | `Custod/TabImporter.swift` |
| `lib/storage.ts` + Supabase       | local JSON in App Support   | `Custod/HistoryStore.swift` |
| `lib/markdown.ts`                 | Markdown export             | `Custod/Markdown.swift` |
| `components/*` + `app/page.tsx`   | SwiftUI screens             | `Custod/ContentView.swift` |
| `app/api/analyze` (HTTP round-trip) | direct in-process call    | (gone — analyzer runs locally) |

## Adapting the Xcode template (the one in your screenshot)

Your template is the default **SwiftUI + SwiftData** project (`Custodt`). Do this:

1. **Delete `Item.swift`** — the template's SwiftData model is unused. Custod
   uses `HistoryStore` (JSON) instead.
2. **Replace `CustodtApp.swift`** with `CustodApp.swift` here. (The template's
   version creates a `ModelContainer` for `Item`; we remove that. If you keep
   the `Custodt` name, just keep the `struct` name `CustodtApp` and the file
   name — the body is what matters.)
3. **Replace `ContentView.swift`** with the one here.
4. **Add the new files** to the `Custodt` group (drag into Xcode, "Copy items
   if needed", add to the app target):
   `Models.swift`, `BurnoutAnalyzer.swift`, `TabParsing.swift`,
   `TabImporter.swift`, `HistoryStore.swift`, `Markdown.swift`.
5. **Keep `Assets.xcassets`** — drop a Custod app icon in later.
6. The `CustodtTests` / `CustodtUITests` targets can stay. A good first unit
   test: feed known tabs into `BurnoutAnalyzer.analyze` and assert the score,
   matching the web app's behavior.

> Tip: file/struct names don't have to be `Custod` vs `Custodt`. Match whatever
> your project uses; only the `@main` struct and the `ContentView` type names
> need to line up with your target.

## Required project settings

Tab import talks to other apps via Apple Events, which macOS gates:

1. **Info.plist** → add key
   `NSAppleEventsUsageDescription` =
   `"Custod reads open tab titles and URLs to detect burnout patterns. Page contents are never read."`
2. **App Sandbox** (target → Signing & Capabilities):
   - For a quick local/hackathon build, **turn App Sandbox off** — Apple Events
     to other apps then just work after the user approves the prompt.
   - To keep the sandbox on, add a temporary-exception entitlement
     `com.apple.security.temporary-exception.apple-events` listing the browser
     bundle ids (`com.apple.Safari`, `com.google.Chrome`, `company.thebrowser.Browser`,
     `com.microsoft.edgemac`, `com.brave.Browser`). Note: temporary-exception
     entitlements are **not allowed on the Mac App Store**, so for a store build
     you'd ship paste-only or a Safari/Chrome companion extension instead.
3. First time the user clicks **Import tabs**, macOS shows
   *"Custod wants to control <Browser>"* — they must click **OK** (and it then
   appears under System Settings → Privacy & Security → Automation).

## Run

Open the project in Xcode, select the **My Mac** run destination, press **⌘R**.
Click **Import tabs** (approve the prompt), adjust the mood sliders, and
**Run check**. Use **Copy Markdown** to export, just like the web app.

## What was intentionally dropped

- **Supabase / hosted storage** — replaced by on-device JSON. Add a sync layer
  later only with an explicit product decision (see the web README safety notes).
- **Public share links** (`/api/share`) — these require a server. Markdown
  export covers the "share a check" use case offline. If you want share links,
  keep the Next.js backend deployed and have the app POST to it.
- **The Chrome extension** — superseded by native AppleScript import.
