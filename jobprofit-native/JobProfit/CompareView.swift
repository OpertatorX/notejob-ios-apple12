import SwiftUI

struct CompareView: View {
    @EnvironmentObject private var store: JobStore
    @Environment(\.dismiss) private var dismiss
    let jobID: UUID

    var body: some View {
        Group {
            if let job = store.job(jobID) {
                ScrollView(showsIndicators: false) {
                    VStack(spacing: 18) {
                        HStack {
                            Button { dismiss() } label: {
                                Image(systemName: "chevron.left")
                                    .font(.system(size: 18, weight: .semibold))
                                    .foregroundStyle(.primary)
                                    .frame(width: 34, height: 34)
                            }
                            .buttonStyle(.plain)
                            Spacer()
                            Text("Estimate vs Actual")
                                .font(.system(size: 17, weight: .bold))
                            Spacer()
                            Color.clear.frame(width: 34, height: 34)
                        }

                        HStack(spacing: 10) {
                            metricCard(title: "Estimated profit", value: store.money(job.estimatedProfit), margin: job.estimatedMargin)
                            metricCard(title: "Actual profit", value: store.money(job.profit), margin: job.margin)
                        }

                        let delta = job.profit - job.estimatedProfit
                        Text("\(delta >= 0 ? "+" : "")\(store.money(delta)) from estimate")
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundStyle(delta >= 0 ? Color.jpGreen : Color.jpRed)
                            .frame(maxWidth: .infinity)
                            .frame(height: 44)
                            .background((delta >= 0 ? Color.jpGreen : Color.jpRed).opacity(0.10), in: RoundedRectangle(cornerRadius: 12, style: .continuous))

                        VStack(alignment: .leading, spacing: 0) {
                            Text("Why?")
                                .font(.system(size: 17, weight: .bold))
                                .padding(.bottom, 6)

                            ForEach(reasons(job), id: \.type) { item in
                                HStack(spacing: 12) {
                                    ZStack {
                                        RoundedRectangle(cornerRadius: 10, style: .continuous)
                                            .fill(item.type.color.opacity(0.11))
                                            .frame(width: 39, height: 39)
                                        Image(systemName: item.type.systemImage)
                                            .font(.system(size: 15, weight: .semibold))
                                            .foregroundStyle(item.type.color)
                                    }
                                    VStack(alignment: .leading, spacing: 3) {
                                        Text(reasonTitle(item.type, delta: item.delta))
                                            .font(.system(size: 14, weight: .semibold))
                                        Text(item.delta > 0 ? reasonSubtitle(item.type) : "On track")
                                            .font(.system(size: 11))
                                            .foregroundStyle(.secondary)
                                    }
                                    Spacer()
                                    Text("\(item.delta > 0 ? "−" : "+")\(store.money(abs(item.delta)))")
                                        .font(.system(size: 13, weight: .semibold))
                                        .foregroundStyle(item.delta > 0 ? Color.jpOrange : Color.jpGreen)
                                }
                                .frame(height: 59)
                                if item.type != reasons(job).last?.type {
                                    Divider().opacity(0.65)
                                }
                            }
                        }

                        VStack(alignment: .leading, spacing: 12) {
                            Text("Profit Evolution")
                                .font(.system(size: 17, weight: .bold))
                            HStack {
                                Text(store.money(job.estimatedProfit))
                                    .font(.system(size: 11, weight: .medium))
                                Spacer()
                                Text(store.money(job.profit))
                                    .font(.system(size: 11, weight: .medium))
                            }
                            ProfitEvolutionChart(values: evolution(job))
                                .frame(height: 120)
                            HStack {
                                Text("Start")
                                Spacer()
                                Text("Jun 12")
                                Spacer()
                                Text("Jun 14")
                                Spacer()
                                Text("Jun 16")
                                Spacer()
                                Text("Today")
                            }
                            .font(.system(size: 9))
                            .foregroundStyle(.secondary)
                        }
                        .padding(.top, 2)
                    }
                    .padding(.horizontal, 18)
                    .padding(.top, 8)
                    .padding(.bottom, 24)
                }
                .background(Color.white)
                .toolbar(.hidden, for: .navigationBar)
            } else {
                ContentUnavailableView("Job not found", systemImage: "exclamationmark.triangle")
            }
        }
    }

    private func metricCard(title: String, value: String, margin: Double) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(value)
                .font(.system(size: 26, weight: .bold, design: .rounded))
            Text(title)
                .font(.system(size: 12))
                .foregroundStyle(.secondary)
            Text(String(format: "%.0f%% margin", margin))
                .font(.system(size: 11, weight: .semibold))
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(14)
        .background(Color.jpSoft, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
    }

    private func reasons(_ job: Job) -> [(type: CostType, delta: Double)] {
        CostType.allCases
            .map { type in (type: type, delta: job.costTotal(for: type) - job.estimate[type]) }
            .sorted { abs($0.delta) > abs($1.delta) }
            .prefix(3)
            .map { $0 }
    }

    private func reasonTitle(_ type: CostType, delta: Double) -> String {
        switch type {
        case .labor: delta > 0 ? "Extra labor" : "Labor"
        case .materials: delta > 0 ? "Material overrun" : "Materials"
        default: "Other changes"
        }
    }

    private func reasonSubtitle(_ type: CostType) -> String {
        switch type {
        case .labor: "More labor than estimated"
        case .materials: "Higher quality materials"
        default: "Above estimate"
        }
    }

    private func evolution(_ job: Job) -> [Double] {
        let start = job.estimatedProfit
        let delta = job.profit - start
        return [0, 0.24, 0.38, 0.55, 0.72, 0.82, 1].map { start + delta * $0 }
    }
}

private struct ProfitEvolutionChart: View {
    let values: [Double]

    var body: some View {
        GeometryReader { proxy in
            let minV = values.min() ?? 0
            let maxV = values.max() ?? 1
            let range = max(maxV - minV, 1)
            let points: [CGPoint] = values.enumerated().map { index, value in
                let x = proxy.size.width * CGFloat(index) / CGFloat(max(values.count - 1, 1))
                let y = proxy.size.height - proxy.size.height * CGFloat((value - minV) / range) * 0.72 - 14
                return CGPoint(x: x, y: y)
            }

            ZStack {
                Path { path in
                    guard let first = points.first, let last = points.last else { return }
                    path.move(to: CGPoint(x: first.x, y: proxy.size.height))
                    path.addLine(to: first)
                    points.dropFirst().forEach { path.addLine(to: $0) }
                    path.addLine(to: CGPoint(x: last.x, y: proxy.size.height))
                    path.closeSubpath()
                }
                .fill(
                    LinearGradient(
                        colors: [Color.jpGreen.opacity(0.22), Color.jpGreen.opacity(0.02)],
                        startPoint: .top,
                        endPoint: .bottom
                    )
                )

                Path { path in
                    guard let first = points.first else { return }
                    path.move(to: first)
                    points.dropFirst().forEach { path.addLine(to: $0) }
                }
                .stroke(Color.jpGreen, style: StrokeStyle(lineWidth: 2, lineCap: .round, lineJoin: .round))

                ForEach(Array(points.enumerated()), id: \.offset) { _, point in
                    Circle()
                        .fill(Color.jpGreen)
                        .frame(width: 6, height: 6)
                        .position(point)
                }
            }
        }
    }
}
