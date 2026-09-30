import SwiftUI

extension Color {
    static let jpBackground = Color(red: 0.972, green: 0.976, blue: 0.984)
    static let jpSurface = Color.white
    static let jpSoft = Color(red: 0.955, green: 0.961, blue: 0.972)
    static let jpLine = Color.black.opacity(0.075)
    static let jpTextSecondary = Color(red: 0.39, green: 0.41, blue: 0.46)
    static let jpBlue = Color(red: 0.055, green: 0.39, blue: 0.98)
    static let jpGreen = Color(red: 0.07, green: 0.66, blue: 0.35)
    static let jpOrange = Color(red: 1.00, green: 0.32, blue: 0.08)
    static let jpRed = Color(red: 0.95, green: 0.16, blue: 0.13)
}

struct JPPageHeader<Trailing: View>: View {
    let title: String
    let trailing: Trailing

    init(_ title: String, @ViewBuilder trailing: () -> Trailing) {
        self.title = title
        self.trailing = trailing()
    }

    var body: some View {
        HStack(spacing: 16) {
            Text(title)
                .font(.system(size: 27, weight: .bold))
                .foregroundStyle(.primary)
            Spacer()
            trailing
        }
        .frame(height: 42)
    }
}

extension JPPageHeader where Trailing == EmptyView {
    init(_ title: String) {
        self.init(title) { EmptyView() }
    }
}

struct JPToolbarButton: View {
    let systemName: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Image(systemName: systemName)
                .font(.system(size: 16, weight: .semibold))
                .foregroundStyle(.primary)
                .frame(width: 34, height: 34)
                .background(Color.jpSoft, in: Circle())
        }
        .buttonStyle(.plain)
    }
}

struct JPMonthPicker: View {
    @Binding var month: Date

    var body: some View {
        HStack(spacing: 9) {
            HStack(spacing: 0) {
                Button { shift(-1) } label: {
                    Image(systemName: "chevron.left")
                        .font(.system(size: 12, weight: .semibold))
                        .frame(width: 42, height: 42)
                }
                Spacer(minLength: 4)
                Text(month.formatted(.dateTime.month(.wide).year()))
                    .font(.system(size: 15, weight: .medium))
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
                Spacer(minLength: 4)
                Button { shift(1) } label: {
                    Image(systemName: "chevron.right")
                        .font(.system(size: 12, weight: .semibold))
                        .frame(width: 42, height: 42)
                }
            }
            .foregroundStyle(.secondary)
            .background(Color.jpSoft, in: RoundedRectangle(cornerRadius: 13, style: .continuous))

            Button { shift(1) } label: {
                Image(systemName: "chevron.right")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(.secondary)
                    .frame(width: 42, height: 42)
                    .background(Color.jpSoft, in: RoundedRectangle(cornerRadius: 13, style: .continuous))
            }
            .buttonStyle(.plain)
        }
    }

    private func shift(_ value: Int) {
        month = Calendar.current.date(byAdding: .month, value: value, to: month) ?? month
    }
}

struct JPMoneyMetric: View {
    let value: String
    let label: String
    let detail: String?
    var tint: Color = .primary
    var alignment: HorizontalAlignment = .leading

    var body: some View {
        VStack(alignment: alignment, spacing: 4) {
            Text(value)
                .font(.system(size: 31, weight: .bold, design: .rounded))
                .foregroundStyle(tint)
                .lineLimit(1)
                .minimumScaleFactor(0.75)
            Text(label)
                .font(.system(size: 13, weight: .regular))
                .foregroundStyle(.secondary)
            if let detail {
                Text(detail)
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(Color.jpGreen)
                    .padding(.top, 1)
            }
        }
    }
}

struct JPOverviewChart: View {
    let values: [Double]
    let maxLabel: String

    private var normalized: [Double] {
        let maxValue = max(values.max() ?? 1, 1)
        return values.map { max(0.08, $0 / maxValue) }
    }

    var body: some View {
        VStack(spacing: 9) {
            HStack(alignment: .bottom, spacing: 9) {
                HStack(alignment: .bottom, spacing: 10) {
                    ForEach(Array(normalized.enumerated()), id: \.offset) { index, value in
                        ZStack(alignment: .bottom) {
                            RoundedRectangle(cornerRadius: 5, style: .continuous)
                                .fill(Color(red: 0.91, green: 0.92, blue: 0.94))
                                .frame(height: 92)
                            RoundedRectangle(cornerRadius: 5, style: .continuous)
                                .fill(
                                    LinearGradient(
                                        colors: [Color.jpGreen.opacity(0.72), Color.jpGreen],
                                        startPoint: .top,
                                        endPoint: .bottom
                                    )
                                )
                                .frame(height: max(15, 92 * value))
                        }
                        .frame(maxWidth: .infinity)
                        .accessibilityLabel("Bar \(index + 1)")
                    }
                }

                VStack(alignment: .trailing, spacing: 0) {
                    Text(maxLabel)
                    Spacer()
                    Text("20K")
                    Spacer()
                    Text("10K")
                    Spacer()
                    Text("0")
                }
                .font(.system(size: 10, weight: .regular))
                .foregroundStyle(.secondary)
                .frame(width: 33, height: 92)
            }

            HStack(spacing: 14) {
                Label {
                    Text("Revenue")
                } icon: {
                    Circle().fill(Color.jpGreen).frame(width: 8, height: 8)
                }
                Label {
                    Text("Profit")
                } icon: {
                    Circle().fill(Color(red: 0.77, green: 0.79, blue: 0.83)).frame(width: 8, height: 8)
                }
                Spacer()
            }
            .font(.system(size: 10, weight: .regular))
            .foregroundStyle(.secondary)
        }
    }
}

struct JPSectionHeader: View {
    let title: String
    let actionTitle: String?
    let action: (() -> Void)?

    init(_ title: String, actionTitle: String? = nil, action: (() -> Void)? = nil) {
        self.title = title
        self.actionTitle = actionTitle
        self.action = action
    }

    var body: some View {
        HStack {
            Text(title)
                .font(.system(size: 17, weight: .bold))
            Spacer()
            if let actionTitle, let action {
                Button(actionTitle, action: action)
                    .font(.system(size: 13, weight: .medium))
                    .foregroundStyle(Color.jpBlue)
                    .buttonStyle(.plain)
            }
        }
    }
}

struct JPJobThumbnail: View {
    let job: Job

    var body: some View {
        Group {
            if let assetName = job.thumbnailAsset {
                Image(assetName)
                    .resizable()
                    .scaledToFill()
            } else {
                ZStack {
                    Color.jpSoft
                    Image(systemName: "house.fill")
                        .foregroundStyle(.secondary)
                }
            }
        }
        .frame(width: 55, height: 55)
        .clipShape(RoundedRectangle(cornerRadius: 11, style: .continuous))
        .overlay {
            RoundedRectangle(cornerRadius: 11, style: .continuous)
                .stroke(Color.black.opacity(0.06), lineWidth: 0.5)
        }
    }
}

struct JPJobRow: View {
    @EnvironmentObject private var store: JobStore
    let job: Job
    var showsProgress = false

    var body: some View {
        HStack(spacing: 12) {
            JPJobThumbnail(job: job)

            VStack(alignment: .leading, spacing: showsProgress ? 5 : 4) {
                HStack(alignment: .firstTextBaseline, spacing: 8) {
                    VStack(alignment: .leading, spacing: 3) {
                        Text(job.name)
                            .font(.system(size: 15, weight: .semibold))
                            .foregroundStyle(.primary)
                            .lineLimit(1)
                        Text(job.type)
                            .font(.system(size: 12, weight: .regular))
                            .foregroundStyle(.secondary)
                            .lineLimit(1)
                    }
                    Spacer(minLength: 8)
                    VStack(alignment: .trailing, spacing: 2) {
                        Text(store.money(job.profit))
                            .font(.system(size: 14, weight: .bold))
                            .foregroundStyle(statusColor)
                        Text(String(format: "%.0f%%", job.margin))
                            .font(.system(size: 12, weight: .semibold))
                            .foregroundStyle(statusColor)
                    }
                }

                if showsProgress {
                    GeometryReader { proxy in
                        ZStack(alignment: .leading) {
                            Capsule().fill(Color(red: 0.90, green: 0.91, blue: 0.93))
                            Capsule().fill(statusColor.opacity(0.78))
                                .frame(width: proxy.size.width * progress)
                        }
                    }
                    .frame(height: 7)
                }
            }
        }
        .padding(.vertical, 8)
    }

    private var statusColor: Color { job.margin < 15 ? .jpOrange : .jpGreen }
    private var progress: CGFloat {
        CGFloat(min(max(job.margin / 60.0, 0.08), 1.0))
    }
}

struct JPSegmentedControl<Value: Hashable>: View {
    let items: [(Value, String)]
    @Binding var selection: Value

    var body: some View {
        HStack(spacing: 4) {
            ForEach(Array(items.enumerated()), id: \.offset) { _, item in
                Button {
                    withAnimation(.easeOut(duration: 0.18)) { selection = item.0 }
                } label: {
                    Text(item.1)
                        .font(.system(size: 13, weight: selection == item.0 ? .semibold : .medium))
                        .foregroundStyle(selection == item.0 ? Color.white : Color.jpTextSecondary)
                        .frame(maxWidth: .infinity)
                        .frame(height: 34)
                        .background(selection == item.0 ? Color.jpBlue : Color.clear, in: RoundedRectangle(cornerRadius: 10, style: .continuous))
                }
                .buttonStyle(.plain)
            }
        }
        .padding(3)
        .background(Color.jpSoft, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
    }
}

struct JPSearchField: View {
    @Binding var text: String

    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: "magnifyingglass")
                .foregroundStyle(.secondary)
            TextField("Search jobs…", text: $text)
                .textInputAutocapitalization(.never)
                .autocorrectionDisabled()
                .font(.system(size: 14))
        }
        .padding(.horizontal, 12)
        .frame(height: 42)
        .background(Color.jpSoft, in: RoundedRectangle(cornerRadius: 11, style: .continuous))
    }
}

struct JPProfitBar: View {
    let label: String
    let amount: String
    let fraction: Double
    var tint: Color = .jpGreen

    var body: some View {
        VStack(spacing: 8) {
            HStack {
                Text(label).font(.system(size: 14, weight: .semibold))
                Spacer()
                Text(amount).font(.system(size: 14, weight: .semibold))
            }
            GeometryReader { proxy in
                ZStack(alignment: .leading) {
                    Capsule().fill(Color(red: 0.90, green: 0.91, blue: 0.93))
                    Capsule().fill(tint).frame(width: max(5, proxy.size.width * min(max(fraction, 0), 1)))
                }
            }
            .frame(height: 9)
        }
    }
}

struct JPPrimaryButton: View {
    let title: String
    var color: Color = .jpBlue
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.system(size: 15, weight: .semibold))
                .foregroundStyle(.white)
                .frame(maxWidth: .infinity)
                .frame(height: 50)
                .background(color, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
        }
        .buttonStyle(.plain)
    }
}

struct JPSecondaryButton: View {
    let title: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.system(size: 15, weight: .semibold))
                .foregroundStyle(.primary)
                .frame(maxWidth: .infinity)
                .frame(height: 50)
                .background(Color.jpSoft, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
        }
        .buttonStyle(.plain)
    }
}

extension CostType {
    var color: Color {
        switch self {
        case .labor: .jpOrange
        case .materials: Color(red: 0.54, green: 0.36, blue: 0.84)
        case .travel: Color(red: 0.31, green: 0.52, blue: 0.96)
        case .subcontract: Color(red: 0.36, green: 0.33, blue: 0.70)
        case .other: .jpGreen
        }
    }
}

extension Job {
    var thumbnailAsset: String? {
        switch name {
        case "Miller Kitchen": "job-kitchen"
        case "Johnson Deck": "job-deck"
        case "Smith Bathroom": "job-bath"
        case "Clark Living Room": "job-clark"
        case "Wilson Home": "job-wilson"
        default: nil
        }
    }
}
