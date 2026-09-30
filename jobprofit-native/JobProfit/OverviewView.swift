import SwiftUI

struct OverviewView: View {
    @EnvironmentObject private var store: JobStore
    @Binding var month: Date
    @State private var showSettings = false

    private var monthJobs: [Job] { store.jobs(in: month) }
    private var active: [Job] { monthJobs.filter { $0.status == .active } }
    private var totals: (revenue: Double, costs: Double, profit: Double) { store.totals(in: month) }
    private var margin: Double { totals.revenue > 0 ? totals.profit / totals.revenue * 100 : 0 }

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(spacing: 0) {
                JPPageHeader("JobProfit") {
                    JPToolbarButton(systemName: "gearshape") { showSettings = true }
                }
                .padding(.bottom, 12)

                JPMonthPicker(month: $month)
                    .padding(.bottom, 17)

                HStack(alignment: .top, spacing: 18) {
                    JPMoneyMetric(
                        value: store.money(totals.revenue),
                        label: "Revenue",
                        detail: store.monthChangeText(in: month),
                        tint: .primary,
                        alignment: .leading
                    )
                    Spacer(minLength: 10)
                    JPMoneyMetric(
                        value: store.money(totals.profit),
                        label: "Profit",
                        detail: String(format: "%.1f%% margin", margin),
                        tint: .jpGreen,
                        alignment: .trailing
                    )
                }
                .padding(.horizontal, 8)
                .padding(.bottom, 19)

                JPOverviewChart(values: chartValues, maxLabel: "30K")
                    .frame(height: 132)
                    .padding(.horizontal, 8)
                    .padding(.bottom, 22)

                HStack {
                    Text("Active Jobs")
                        .font(.system(size: 17, weight: .bold))
                    Spacer()
                    NavigationLink("See All") {
                        JobsView(month: $month)
                    }
                    .font(.system(size: 13, weight: .medium))
                    .foregroundStyle(Color.jpBlue)
                }
                .padding(.bottom, 4)

                VStack(spacing: 0) {
                    if active.isEmpty {
                        ContentUnavailableView(
                            "No active jobs",
                            systemImage: "briefcase",
                            description: Text("Create a job from the Jobs tab to start tracking profit.")
                        )
                        .frame(minHeight: 180)
                    } else {
                        ForEach(Array(active.prefix(3).enumerated()), id: \.element.id) { index, job in
                            NavigationLink {
                                JobDetailView(jobID: job.id)
                            } label: {
                                JPJobRow(job: job)
                            }
                            .buttonStyle(.plain)

                            if index < min(active.count, 3) - 1 {
                                Divider().opacity(0.65)
                            }
                        }
                    }
                }
            }
            .padding(.horizontal, 18)
            .padding(.top, 8)
            .padding(.bottom, 24)
        }
        .background(Color.white)
        .toolbar(.hidden, for: .navigationBar)
        .navigationDestination(isPresented: $showSettings) {
            SettingsView()
        }
    }

    private var chartValues: [Double] {
        let jobs = monthJobs.sorted { $0.date < $1.date }
        if jobs.isEmpty { return [0.30, 0.36, 0.48, 0.62, 0.56, 0.49, 0.43, 0.31] }
        let values = jobs.map(\.revenue)
        let padded = values + Array(repeating: values.last ?? 1, count: max(0, 8 - values.count))
        return Array(padded.prefix(8))
    }
}
