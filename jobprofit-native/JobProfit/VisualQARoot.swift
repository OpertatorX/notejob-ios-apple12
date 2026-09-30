import SwiftUI

enum VisualQAScreen: String {
    case overview, jobs, detail, compare, addCost, activity, insights, jobTypes, settings

    static var current: VisualQAScreen? {
        let args = ProcessInfo.processInfo.arguments
        guard let index = args.firstIndex(of: "--visual-qa"), args.indices.contains(index + 1) else { return nil }
        return VisualQAScreen(rawValue: args[index + 1])
    }
}

struct VisualQARoot: View {
    @EnvironmentObject private var store: JobStore
    let screen: VisualQAScreen
    @State private var month = Calendar.current.date(from: DateComponents(year: 2025, month: 9, day: 1)) ?? .now

    private var primaryJobID: UUID? {
        store.jobs.first(where: { $0.name == "Miller Kitchen" })?.id ?? store.jobs.first?.id
    }

    var body: some View {
        Group {
            switch screen {
            case .overview:
                NavigationStack { OverviewView(month: $month) }
            case .jobs:
                NavigationStack { JobsView(month: $month) }
            case .detail:
                if let primaryJobID { NavigationStack { JobDetailView(jobID: primaryJobID) } }
            case .compare:
                if let primaryJobID { NavigationStack { CompareView(jobID: primaryJobID) } }
            case .addCost:
                if let primaryJobID { AddCostView(jobID: primaryJobID) }
            case .activity:
                if let primaryJobID { NavigationStack { JobDetailView(jobID: primaryJobID, initialTab: .activity) } }
            case .insights:
                NavigationStack { InsightsView(month: $month) }
            case .jobTypes:
                NavigationStack { JobTypesView(month: month) }
            case .settings:
                NavigationStack { SettingsView() }
            }
        }
        .background(Color.white)
    }
}
