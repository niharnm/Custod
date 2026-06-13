import Foundation

// Native replacement for the Chrome extension (extension/src/lib/collectTabs.ts).
// Reads open tabs directly from the user's browser via Apple Events / AppleScript.
//
// Requires, in the app target:
//   • Info.plist key NSAppleEventsUsageDescription with a user-facing reason.
//   • If App Sandbox is ON, a temporary-exception entitlement for Apple Events
//     (com.apple.security.temporary-exception.apple-events) listing the browser
//     bundle ids, OR turn the sandbox off for a local hackathon build.
// The first run triggers a macOS "Custod wants to control <Browser>" prompt.

enum Browser: String, CaseIterable, Identifiable {
    case safari = "Safari"
    case chrome = "Google Chrome"
    case arc = "Arc"
    case edge = "Microsoft Edge"
    case brave = "Brave Browser"

    var id: String { rawValue }

    // Safari exposes `name`; Chromium browsers expose `title`.
    fileprivate var titleProperty: String { self == .safari ? "name" : "title" }
}

enum TabImportError: LocalizedError {
    case scriptFailed(String)
    case notRunning(String)

    var errorDescription: String? {
        switch self {
        case .scriptFailed(let m): return m
        case .notRunning(let app): return "\(app) does not appear to be running."
        }
    }
}

enum TabImporter {

    /// Collects http/https tabs from the front browser window, mirroring collectTabs().
    static func importTabs(from browser: Browser) throws -> [BrowserTab] {
        let prop = browser.titleProperty
        // Tab-delimited "title\turl" lines, one per tab in the front window.
        let source = """
        tell application "\(browser.rawValue)"
            set out to ""
            if (count of windows) is 0 then return ""
            set theWindow to front window
            repeat with t in (tabs of theWindow)
                set out to out & (\(prop) of t) & "\t" & (URL of t) & "\n"
            end repeat
            return out
        end tell
        """

        guard let script = NSAppleScript(source: source) else {
            throw TabImportError.scriptFailed("Could not build AppleScript.")
        }

        var errorInfo: NSDictionary?
        let result = script.executeAndReturnError(&errorInfo)
        if let errorInfo {
            let message = errorInfo[NSAppleScript.errorMessage] as? String ?? "Unknown AppleScript error."
            throw TabImportError.scriptFailed(message)
        }

        let raw = result.stringValue ?? ""
        return parse(raw)
    }

    private static func parse(_ raw: String) -> [BrowserTab] {
        raw.split(separator: "\n").compactMap { line -> BrowserTab? in
            let parts = line.components(separatedBy: "\t")
            let title = parts.first?.trimmingCharacters(in: .whitespaces) ?? ""
            let url = parts.count > 1 ? parts[1].trimmingCharacters(in: .whitespaces) : ""
            // Match the extension filter: only http/https tabs.
            guard url.hasPrefix("http://") || url.hasPrefix("https://") else { return nil }
            return BrowserTab(title: title.isEmpty ? url : title, url: url, active: false)
        }
    }
}
