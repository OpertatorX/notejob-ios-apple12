import SwiftUI

struct JobDetailView: View {
    enum Tab: String, CaseIterable, Identifiable {
        case overview = "Overview"
        case costs = "Costs"
        case activity = "Activity"
        case details = "Details"
        var id: String { rawValue }
    }

    @EnvironmentObject private var store: JobStore
    @Environment(\.dismiss) private var dismiss
    let jobID: UUID

    @State private var tab: Tab
    @State private var showAddCost = false
    @State private var showEdit = false
    @State private var showDelete = false
    @State private var showCompare = false

    private var job: Job? { store.job(jobID) }

    init(jobID: UUID, initialTab: Tab = .overview) {
        self.jobID = jobID
        _tab = State(initialValue: initialTab)
    }

    var body: some View {
        Group {
            if let job {
                VStack(spacing: 0) {
                    ScrollView(showsIndicators: false) {
                        VStack(spacing: 0) {
                            topBar(job)
                                .padding(.bottom, 12)

                            jobTitle(job)
                                .padding(.bottom, 14)

                            JPSegmentedControl(
                                items: Tab.allCases.map { ($0, $0.rawValue) },
                                selection: $tab
                            )
                            .padding(.bottom, 16)

                            Group {
                                switch tab {
                                case .overview:
                                    JobOverviewTab(job: job, showCompare: $showCompare)
                                case .costs:
                                    JobCostsTab(job: job)
                                case .activity:
                                    JobActivityTab(job: job)
                                case .details:
                                    JobDetailsTab(job: job, showEdit: $showEdit)
                                }
                            }
                            .padding(.bottom, 90)
                        }
                        .padding(.horizontal, 18)
                        .padding(.top, 8)
                    }
                }
                .background(Color.white)
                .safeAreaInset(edge: .bottom) {
                    HStack(spacing: 10) {
                        JPSecondaryButton(title: "Add Cost") { showAddCost = true }
                        JPPrimaryButton(
                            title: job.status == .completed ? "Reopen Job" : "Complete Job",
                            color: job.status == .completed ? .jpBlue : .black
                        ) {
                            store.toggleComplete(jobID)
                        }
                    }
                    .padding(.horizontal, 18)
                    .padding(.top, 10)
                    .padding(.bottom, 8)
                    .background(.ultraThinMaterial)
                }
                .toolbar(.hidden, for: .navigationBar)
                .sheet(isPresented: $showAddCost) {
                    AddCostView(jobID: jobID)
                        .presentationDetents([.fraction(0.82)])
                        .presentationDragIndicator(.hidden)
                        .presentationCornerRadius(28)
                }
                .sheet(isPresented: $showEdit) {
                    NavigationStack { JobFormView(editing: jobID) }
                        .presentationBackground(Color.jpBackground)
                }
                .navigationDestination(isPresented: $showCompare) {
                    CompareView(jobID: jobID)
                }
                .confirmationDialog("Delete this job?", isPresented: $showDelete, titleVisibility: .visible) {
                    Button("Delete Job", role: .destructive) {
                        store.delete(jobID)
                        dismiss()
                    }
                    Button("Cancel", role: .cancel) {}
                }
            } else {
                ContentUnavailableView("Job not found", systemImage: "exclamationmark.triangle")
            }
        }
    }

    @ViewBuilder
    private func topBar(_ job: Job) -> some View {
        HStack {
            Button { dismiss() } label: {
                Image(systemName: "chevron.left")
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundStyle(.primary)
                    .frame(width: 34, height: 34)
            }
            .buttonStyle(.plain)

            Spacer()

            Menu {
                Button("Edit Job", systemImage: "pencil") { showEdit = true }
                Button("Duplicate Job", systemImage: "plus.square.on.square") { _ = store.duplicate(jobID) }
                ShareLink(item: store.summary(jobID)) { Label("Share Summary", systemImage: "square.and.arrow.up") }
                Divider()
                Button("Delete Job", systemImage: "trash", role: .destructive) { showDelete = true }
            } label: {
                Image(systemName: "ellipsis")
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundStyle(.primary)
                    .frame(width: 34, height: 34)
            }
            .buttonStyle(.plain)
        }
        .frame(height: 38)
    }

    @ViewBuilder
    private func jobTitle(_ job: Job) -> some View {
        HStack(alignment: .top, spacing: 12) {
            VStack(alignment: .leading, spacing: 4) {
                Text(job.name)
                    .font(.system(size: 25, weight: .bold))
                Text(job.type)
                    .font(.system(size: 13))
                    .foregroundStyle(.secondary)
            }
            Spacer()
            Text(job.status == .active ? "Active" : "Completed")
                .font(.system(size: 12, weight: .semibold))
                .foregroundStyle(job.status == .active ? Color.jpGreen : Color.jpTextSecondary)
                .padding(.horizontal, 12)
                .frame(height: 30)
                .background((job.status == .active ? Color.jpGreen : Color.gray).opacity(0.13), in: Capsule())
        }
    }
}

private struct JobOverviewTab: View {
    @EnvironmentObject private var store: JobStore
    let job: Job
    @Binding var showCompare: Bool

    var body: some View {
        VStack(spacing: 18) {
            HStack(alignment: .bottom) {
                VStack(alignment: .leading, spacing: 3) {
                    Text(store.money(job.profit))
                        .font(.system(size: 36, weight: .bold, design: .rounded))
                        .foregroundStyle(.jpGreen)
                    Text("Actual Profit")
                        .font(.system(size: 13))
                        .foregroundStyle(.secondary)
                }
                Spacer()
                VStack(alignment: .trailing, spacing: 3) {
                    Text(String(format: "%.0f%%", job.margin))
                        .font(.system(size: 29, weight: .bold, design: .rounded))
                        .foregroundStyle(.jpGreen)
                    Text("Margin")
                        .font(.system(size: 13))
                        .foregroundStyle(.secondary)
                }
            }

            Button {
                showCompare = true
            } label: {
                HStack {
                    Text("Estimate vs Actual")
                        .font(.system(size: 13, weight: .semibold))
                    Spacer()
                    Image(systemName: "chevron.right")
                        .font(.system(size: 12, weight: .semibold))
                }
                .foregroundStyle(Color.jpBlue)
                .padding(.horizontal, 14)
                .frame(height: 40)
                .background(Color.jpBlue.opacity(0.08), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
            }
            .buttonStyle(.plain)

            JPProfitBar(label: "Revenue", amount: store.money(job.revenue), fraction: 0.72, tint: .jpGreen)
            JPProfitBar(label: "Costs", amount: store.money(job.costTotal), fraction: min(job.costTotal / max(job.revenue, 1), 1), tint: Color(red: 0.56, green: 0.59, blue: 0.64))

            VStack(spacing: 0) {
                ForEach(CostType.allCases) { type in
                    CostSummaryRow(job: job, type: type)
                    if type != .other { Divider().opacity(0.7) }
                }
            }
            .padding(.top, 2)
        }
    }
}

private struct CostSummaryRow: View {
    @EnvironmentObject private var store: JobStore
    let job: Job
    let type: CostType

    var body: some View {
        HStack(spacing: 12) {
            ZStack {
                RoundedRectangle(cornerRadius: 8, style: .continuous)
                    .fill(type.color.opacity(0.12))
                    .frame(width: 31, height: 31)
                Image(systemName: type.systemImage)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(type.color)
            }
            Text(type.title)
                .font(.system(size: 14, weight: .medium))
            Spacer()
            Text(store.money(job.costTotal(for: type)))
                .font(.system(size: 14, weight: .semibold))
            Text(String(format: "%.1f%%", job.revenue > 0 ? job.costTotal(for: type) / job.revenue * 100 : 0))
                .font(.system(size: 12))
                .foregroundStyle(.secondary)
                .frame(width: 47, alignment: .trailing)
        }
        .frame(height: 53)
    }
}

private struct JobCostsTab: View {
    @EnvironmentObject private var store: JobStore
    let job: Job

    var body: some View {
        LazyVStack(spacing: 10) {
            if job.costs.isEmpty {
                ContentUnavailableView("No costs yet", systemImage: "creditcard", description: Text("Add labor, materials, travel, subcontractor or other costs."))
                    .padding(.top, 50)
            } else {
                ForEach(job.costs.sorted { $0.date > $1.date }) { cost in
                    HStack(spacing: 12) {
                        ZStack {
                            RoundedRectangle(cornerRadius: 10, style: .continuous)
                                .fill(cost.type.color.opacity(0.12))
                                .frame(width: 38, height: 38)
                            Image(systemName: cost.type.systemImage)
                                .foregroundStyle(cost.type.color)
                        }
                        VStack(alignment: .leading, spacing: 3) {
                            Text(cost.type.title).font(.system(size: 14, weight: .semibold))
                            Text(cost.note.isEmpty ? cost.date.formatted(date: .abbreviated, time: .omitted) : "\(cost.date.formatted(date: .abbreviated, time: .omitted)) · \(cost.note)")
                                .font(.system(size: 11))
                                .foregroundStyle(.secondary)
                                .lineLimit(1)
                        }
                        Spacer()
                        Text(store.money(cost.amount))
                            .font(.system(size: 14, weight: .semibold))
                        Button(role: .destructive) {
                            store.deleteCost(jobID: job.id, costID: cost.id)
                        } label: {
                            Image(systemName: "trash")
                                .font(.system(size: 13, weight: .semibold))
                        }
                        .buttonStyle(.plain)
                    }
                    .padding(14)
                    .background(Color.jpSoft, in: RoundedRectangle(cornerRadius: 15, style: .continuous))
                }
            }
        }
    }
}

private struct JobActivityTab: View {
    @EnvironmentObject private var store: JobStore
    let job: Job

    var body: some View {
        VStack(spacing: 16) {
            HStack {
                VStack(alignment: .leading, spacing: 3) {
                    Text(job.workStart == nil ? "Work timer" : "Work session running")
                        .font(.system(size: 16, weight: .bold))
                    Text(job.workStart == nil ? "Track labor without typing hours manually." : "Started \(job.workStart?.formatted(date: .omitted, time: .shortened) ?? "")")
                        .font(.system(size: 12))
                        .foregroundStyle(.secondary)
                }
                Spacer()
                Button {
                    if job.workStart == nil { store.startWork(job.id) }
                    else { _ = store.stopWork(job.id) }
                } label: {
                    Image(systemName: job.workStart == nil ? "play.fill" : "stop.fill")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundStyle(.white)
                        .frame(width: 42, height: 42)
                        .background(job.workStart == nil ? Color.jpBlue : Color.jpRed, in: Circle())
                }
                .buttonStyle(.plain)
            }
            .padding(14)
            .background(Color.jpSoft, in: RoundedRectangle(cornerRadius: 15, style: .continuous))

            if job.activity.isEmpty {
                ContentUnavailableView("No activity yet", systemImage: "clock")
                    .padding(.top, 30)
            } else {
                VStack(spacing: 0) {
                    ForEach(Array(job.activity.sorted { $0.date > $1.date }.enumerated()), id: \.element.id) { index, entry in
                        ActivityTimelineRow(entry: entry, isLast: index == job.activity.count - 1)
                    }
                }
            }
        }
    }
}

private struct ActivityTimelineRow: View {
    let entry: ActivityEntry
    let isLast: Bool

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            VStack(spacing: 0) {
                ZStack {
                    Circle().fill(color.opacity(0.14)).frame(width: 34, height: 34)
                    Image(systemName: symbol)
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(color)
                }
                if !isLast {
                    Rectangle().fill(color.opacity(0.23)).frame(width: 2, height: 42)
                }
            }

            VStack(alignment: .leading, spacing: 3) {
                HStack {
                    Text(entry.title)
                        .font(.system(size: 14, weight: .semibold))
                    Spacer()
                    if !entry.value.isEmpty {
                        Text(entry.value)
                            .font(.system(size: 12, weight: .medium))
                            .foregroundStyle(.secondary)
                    }
                }
                Text(entry.date.formatted(date: .abbreviated, time: .shortened))
                    .font(.system(size: 11))
                    .foregroundStyle(.secondary)
            }
            .padding(.top, 2)
            .padding(.bottom, 24)
        }
    }

    private var symbol: String {
        switch entry.kind {
        case .start: "play.fill"
        case .labor: "clock.fill"
        case .materials: "shippingbox.fill"
        case .complete: "checkmark"
        case .reopen: "arrow.uturn.backward"
        case .other: "circle.fill"
        }
    }

    private var color: Color {
        switch entry.kind {
        case .complete: .jpGreen
        case .materials: Color(red: 0.55, green: 0.30, blue: 0.96)
        case .labor, .start: .jpBlue
        case .reopen: .jpOrange
        case .other: .jpTextSecondary
        }
    }
}

private struct JobDetailsTab: View {
    @EnvironmentObject private var store: JobStore
    let job: Job
    @Binding var showEdit: Bool

    var body: some View {
        VStack(spacing: 0) {
            detail("Client", job.client)
            Divider().opacity(0.7)
            detail("Job type", job.type)
            Divider().opacity(0.7)
            detail("Revenue", store.money(job.revenue))
            Divider().opacity(0.7)
            detail("Hourly labor cost", store.money(job.hourlyRate))

            JPPrimaryButton(title: "Edit Job") { showEdit = true }
                .padding(.top, 24)
        }
    }

    private func detail(_ key: String, _ value: String) -> some View {
        HStack {
            Text(key).foregroundStyle(.secondary)
            Spacer()
            Text(value).fontWeight(.medium)
        }
        .font(.system(size: 14))
        .frame(height: 52)
    }
}
