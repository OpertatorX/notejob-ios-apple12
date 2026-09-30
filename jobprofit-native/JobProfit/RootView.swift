import SwiftUI

struct RootView: View {
    @EnvironmentObject private var store: JobStore
    @State private var selectedTab = 0
    @State private var month = Calendar.current.date(from: DateComponents(year: 2025, month: 9, day: 1)) ?? .now

    var body: some View {
        TabView(selection: $selectedTab) {
            NavigationStack {
                OverviewView(month: $month)
            }
            .tabItem { Label("Overview", systemImage: "house.fill") }
            .tag(0)

            NavigationStack {
                JobsView(month: $month)
            }
            .tabItem { Label("Jobs", systemImage: "briefcase.fill") }
            .tag(1)

            NavigationStack {
                InsightsView(month: $month)
            }
            .tabItem { Label("Insights", systemImage: "chart.bar.fill") }
            .tag(2)
        }
        .tint(.jpBlue)
        .toolbarBackground(Color.white, for: .tabBar)
        .toolbarBackground(.visible, for: .tabBar)
    }
}
