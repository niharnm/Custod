import Foundation

// Port of parseTabsInput() from lib/utils.ts — lets users paste tabs by hand
// (one per line) as a fallback to native import.

enum TabParsing {
    private static let urlRegex = try! NSRegularExpression(pattern: "https?://[^\\s]+", options: [.caseInsensitive])
    private static let bareDomainRegex = try! NSRegularExpression(
        pattern: "^[a-z0-9-]+(\\.[a-z0-9-]+)+(/\\S*)?$", options: [.caseInsensitive])

    static func parse(_ text: String) -> [BrowserTab] {
        var tabs: [BrowserTab] = []
        for rawLine in text.split(whereSeparator: { $0 == "\n" || $0 == "\r\n" }) {
            let line = rawLine.trimmingCharacters(in: .whitespaces)
            if line.isEmpty { continue }
            let range = NSRange(line.startIndex..., in: line)

            if let match = urlRegex.firstMatch(in: line, range: range), let r = Range(match.range, in: line) {
                var url = String(line[r])
                while let last = url.last, ")].,".contains(last) { url.removeLast() }
                var title = line.replacingOccurrences(of: String(line[r]), with: "")
                title = title.trimmingCharacters(in: CharacterSet(charactersIn: " |:–—-\t"))
                tabs.append(BrowserTab(title: title.isEmpty ? url : title, url: url))
                continue
            }

            if bareDomainRegex.firstMatch(in: line, range: range) != nil {
                tabs.append(BrowserTab(title: line, url: "https://\(line)"))
                continue
            }

            tabs.append(BrowserTab(title: line, url: ""))
        }
        return tabs
    }

    static func format(_ tabs: [BrowserTab]) -> String {
        tabs.map { tab in
            let name = tab.title.isEmpty ? tab.url : tab.title
            return tab.url.isEmpty ? name : "\(name) - \(tab.url)"
        }.joined(separator: "\n")
    }
}
