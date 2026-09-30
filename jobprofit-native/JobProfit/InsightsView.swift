import SwiftUI

struct InsightsView: View {
    @EnvironmentObject private var store: JobStore
    @Binding var month: Date

    private var jobs: [Job] { store.jobs(in: month) }
    private var totals: (revenue: Double, costs: Double, profit: Double) { store.totals(in: month) }
    private var margin: Double { totals.revenue > 0 ? totals.profit / totals.revenue * 100 : 0 }

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(spacing: 0) {
                JPPageHeader("Insights") {
                    Menu {
                        Button("Previous month") { shift(-1) }
                        Button("Next month") { shift(1) }
                    } label: {
                        HStack(spacing: 5) {
                            Text("This Month")
                            Image(systemName: "chevron.down")
                        }
                        .font(.system(size: 12, weight: .medium))
                        .foregroundStyle(.primary)
                        .padding(.horizontal, 11)
                        .frame(height: 32)
                        .background(Color.jpSoft, in: Capsule())
                    }
                }
                .padding(.bottom, 14)

                HStack(spacing: 8) {
                    stat("Revenue", store.money(totals.revenue), .primary)
                    stat("Costs", store.money(totals.costs), .primary)
                    stat("Profit", store.money(totals.profit), .jpGreen)
                }
                .padding(.bottom, 18)

                VStack(alignment: .leading, spacing: 3) {
                    Text(String(format: "%.1f%%", margin))
                        .font(.system(size: 30, weight: .bold, design: .rounded))
                    Text("Average margin")
                        .font(.system(size: 12))
                        .foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.bottom, 10)

                JPOverviewChart(values: chartValues, maxLabel: "30K")
                    .frame(height: 132)
                    .padding(.bottom, 18)

                NavigationLink {
                    JobTypesView(month: month)
                } label: {
                    HStack {
                        VStack(alignment: .leading, spacing: 3) {
                            Text("Job Types")
                                .font(.system(size: 17, weight: .bold))
                                .foregroundStyle(.primary)
                            Text("See which work gives you the strongest margins")
                                .font(.system(size: 12))
                                .foregroundStyle(.secondary)
                        }
                        Spacer()
                        Image(systemName: "chevron.right")
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundStyle(.secondary)
                    }
                    .padding(14)
                    .background(Color.jpSoft, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                }
                .buttonStyle(.plain)
            }
            .padding(.horizontal, 18)
            .padding(.top, 8)
            .padding(.bottom, 24)
        }
        .background(Color.white)
        .toolbar(.hidden, for: .navigationBar)
    }

    private func stat(_ label: String, _ value: String, _ color: Color) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(value)
                .font(.system(size: 17, weight: .bold, design: .rounded))
                .foregroundStyle(color)
                .lineLimit(1)
                .minimumScaleFactor(0.7)
            Text(label)
                .font(.system(size: 11))
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(11)
        .background(Color.jpSoft, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
    }

    private var chartValues: [Double] {
        let sorted = jobs.sorted { $0.date < $1.date }.map(\.profit)
        let base = sorted.isEmpty ? [0.48,0.57,0.66,0.78,0.70,0.83,0.64,0.55] : sorted
        let padded = base + Array(repeating: base.last ?? 1, count: max(0, 8 - base.count))
        return Array(padded.prefix(8))
    }

    private func shift(_ value: Int) {
        month = Calendar.current.date(byAdding: .month, value: value, to: month) ?? month
    }
}

struct JobTypesView: View {
    @EnvironmentObject private var store: JobStore
    @Environment(\.dismiss) private var dismiss
    let month: Date

    private var typeMargins: [(name: String, margin: Double)] {
        let groups = Dictionary(grouping: store.jobs(in: month), by: \Job.type)
        return groups.map { name, jobs in
            let revenue = jobs.reduce(0) { $0 + $1.revenue }
            let profit = jobs.reduce(0) { $0 + $1.profit }
            return (name, revenue > 0 ? profit / revenue * 100 : 0)
        }
        .sorted { $0.margin > $1.margin }
    }

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(spacing: 0) {
                HStack {
                    Button { dismiss() } label: {
                        Image(systemName: "chevron.left")
                            .font(.system(size: 18, weight: .semibold))
                            .foregroundStyle(.primary)
                            .frame(width: 34, height: 34)
                    }
                    .buttonStyle(.plain)
                    Spacer()
                    Text("Job Types")
                        .font(.system(size: 17, weight: .bold))
                    Spacer()
                    Text("Profit")
                        .font(.system(size: 11, weight: .medium))
                        .padding(.horizontal, 10)
                        .frame(height: 28)
                        .background(Color.jpSoft, in: Capsule())
                }
                .padding(.bottom, 20)

                VStack(spacing: 20) {
                    ForEach(Array(typeMargins.enumerated()), id: \.offset) { _, item in
                        VStack(spacing: 7) {
                            HStack {
                                Text(item.name)
                                    .font(.system(size: 14, weight: .medium))
                                Spacer()
                                Text(String(format: "%.0f%%", item.margin))
                                    .font(.system(size: 14, weight: .semibold))
                            }
                            GeometryReader { proxy in
                                ZStack(alignment: .leading) {
                                    Capsule().fill(Color(red: 0.91, green: 0.92, blue: 0.94))
                                    Capsule().fill(Color.jpGreen.opacity(0.78))
                                        .frame(width: proxy.size.width * min(max(item.margin / 60, 0.05), 1))
                                }
                            }
                            .frame(height: 8)
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
    }
}
