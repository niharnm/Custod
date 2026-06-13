import SwiftUI

// Replaces the template's CustodtApp.swift.
// Note: the template used SwiftData (ModelContainer + Item). Custod stores its
// own JSON history via HistoryStore, so the SwiftData container is removed.

@main
struct CustodApp: App {
    @StateObject private var history = HistoryStore()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(history)
                .frame(minWidth: 760, minHeight: 560)
        }
        .windowResizability(.contentSize)
    }
}
