import SwiftUI

@main
struct JobProfitApp: App {
    @StateObject private var store = JobStore()

    var body: some Scene {
        WindowGroup {
            Group {
                if let visualScreen = VisualQAScreen.current {
                    VisualQARoot(screen: visualScreen)
                } else {
                    RootView()
                }
            }
            .environmentObject(store)
            .preferredColorScheme(.light)
        }
    }
}
