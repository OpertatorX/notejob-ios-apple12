import SwiftUI

struct JobFormView: View {
    @EnvironmentObject private var store: JobStore
    @Environment(\.dismiss) private var dismiss

    let editing: UUID?

    @State private var name = ""
    @State private var client = ""
    @State private var type = ""
    @State private var revenue = ""
    @State private var hourlyRate = "35"
    @State private var labor = ""
    @State private var materials = ""
    @State private var travel = ""
    @State private var subcontract = ""
    @State private var other = ""
    @State private var date = Date()

    init(editing: UUID? = nil) {
        self.editing = editing
    }

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(spacing: 18) {
                HStack {
                    Button("Cancel") { dismiss() }
                        .foregroundStyle(Color.jpBlue)
                    Spacer()
                    Text(editing == nil ? "New Job" : "Edit Job")
                        .font(.system(size: 17, weight: .bold))
                    Spacer()
                    Button("Save") { save() }
                        .foregroundStyle(valid ? Color.jpBlue : Color.secondary)
                        .disabled(!valid)
                }
                .font(.system(size: 15, weight: .medium))
                .frame(height: 38)

                formSection("JOB") {
                    field("Job name", value: $name)
                    divider
                    field("Client", value: $client)
                    divider
                    HStack {
                        VStack(alignment: .leading, spacing: 3) {
                            Text("Job type")
                                .font(.system(size: 12))
                                .foregroundStyle(.secondary)
                            Text(type.isEmpty ? "Choose a type" : type)
                                .font(.system(size: 15, weight: .medium))
                                .foregroundStyle(type.isEmpty ? Color.secondary : Color.primary)
                        }
                        Spacer()
                        Picker("Job type", selection: $type) {
                            ForEach(store.settings.categories, id: \.self) { Text($0).tag($0) }
                        }
                        .labelsHidden()
                        .tint(.secondary)
                    }
                    .frame(height: 52)
                    divider
                    HStack {
                        Text("Date")
                            .font(.system(size: 15, weight: .medium))
                        Spacer()
                        DatePicker("", selection: $date, displayedComponents: .date)
                            .labelsHidden()
                            .datePickerStyle(.compact)
                    }
                    .frame(height: 52)
                }

                formSection("MONEY") {
                    moneyRow("Revenue", value: $revenue)
                    divider
                    moneyRow("Hourly labor cost", value: $hourlyRate)
                }

                formSection("ESTIMATED COSTS") {
                    moneyRow("Labor", value: $labor)
                    divider
                    moneyRow("Materials", value: $materials)
                    divider
                    moneyRow("Travel", value: $travel)
                    divider
                    moneyRow("Subcontract", value: $subcontract)
                    divider
                    moneyRow("Other", value: $other)
                }

                if number(revenue) > 0 {
                    let previewRevenue = number(revenue)
                    let estimate = number(labor) + number(materials) + number(travel) + number(subcontract) + number(other)
                    let previewProfit = previewRevenue - estimate
                    HStack {
                        VStack(alignment: .leading, spacing: 3) {
                            Text("PROJECTED PROFIT")
                                .font(.system(size: 10, weight: .bold))
                                .foregroundStyle(.secondary)
                            Text(store.money(previewProfit))
                                .font(.system(size: 30, weight: .bold, design: .rounded))
                                .foregroundStyle(previewProfit >= 0 ? Color.jpGreen : Color.jpRed)
                        }
                        Spacer()
                        VStack(alignment: .trailing, spacing: 3) {
                            Text(String(format: "%.1f%%", previewRevenue > 0 ? previewProfit / previewRevenue * 100 : 0))
                                .font(.system(size: 19, weight: .bold))
                                .foregroundStyle(previewProfit >= 0 ? Color.jpGreen : Color.jpRed)
                            Text("margin")
                                .font(.system(size: 11))
                                .foregroundStyle(.secondary)
                        }
                    }
                    .padding(14)
                    .background(Color.jpSoft, in: RoundedRectangle(cornerRadius: 15, style: .continuous))
                }

                JPPrimaryButton(title: editing == nil ? "Create Job" : "Save Changes") { save() }
                    .opacity(valid ? 1 : 0.45)
                    .disabled(!valid)
            }
            .padding(.horizontal, 18)
            .padding(.top, 10)
            .padding(.bottom, 28)
        }
        .background(Color.jpBackground)
        .toolbar(.hidden, for: .navigationBar)
        .onAppear(perform: load)
    }

    @ViewBuilder
    private func formSection<Content: View>(_ title: String, @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(.system(size: 11, weight: .bold))
                .foregroundStyle(.secondary)
                .padding(.leading, 4)
            VStack(spacing: 0) { content() }
                .padding(.horizontal, 14)
                .background(Color.white, in: RoundedRectangle(cornerRadius: 15, style: .continuous))
        }
    }

    @ViewBuilder
    private func field(_ label: String, value: Binding<String>) -> some View {
        TextField(label, text: value)
            .font(.system(size: 15, weight: .medium))
            .frame(height: 52)
    }

    @ViewBuilder
    private func moneyRow(_ label: String, value: Binding<String>) -> some View {
        HStack {
            Text(label)
                .font(.system(size: 15, weight: .medium))
            Spacer()
            Text(store.currencySymbol)
                .foregroundStyle(.secondary)
            TextField("0", text: value)
                .keyboardType(.decimalPad)
                .multilineTextAlignment(.trailing)
                .font(.system(size: 15, weight: .semibold))
                .frame(width: 100)
        }
        .frame(height: 52)
    }

    private var divider: some View { Divider().opacity(0.65) }

    private var valid: Bool {
        !name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty && number(revenue) > 0 && !type.isEmpty
    }

    private func number(_ string: String) -> Double {
        Double(string.replacingOccurrences(of: ",", with: ".")) ?? 0
    }

    private func load() {
        if type.isEmpty { type = store.settings.categories.first ?? "Other" }
        guard let editing, let job = store.job(editing) else { return }
        name = job.name
        client = job.client
        type = job.type
        revenue = String(job.revenue)
        hourlyRate = String(job.hourlyRate)
        labor = String(job.estimate.labor)
        materials = String(job.estimate.materials)
        travel = String(job.estimate.travel)
        subcontract = String(job.estimate.subcontract)
        other = String(job.estimate.other)
        date = job.date
    }

    private func save() {
        guard valid else { return }
        let estimate = JobEstimate(
            labor: number(labor),
            materials: number(materials),
            travel: number(travel),
            subcontract: number(subcontract),
            other: number(other)
        )

        if let editing, var job = store.job(editing) {
            job.name = name.trimmingCharacters(in: .whitespacesAndNewlines)
            job.client = client.trimmingCharacters(in: .whitespacesAndNewlines)
            job.type = type
            job.revenue = number(revenue)
            job.hourlyRate = number(hourlyRate)
            job.estimate = estimate
            job.date = date
            store.update(job)
        } else {
            store.add(
                Job(
                    name: name.trimmingCharacters(in: .whitespacesAndNewlines),
                    client: client.trimmingCharacters(in: .whitespacesAndNewlines),
                    type: type,
                    revenue: number(revenue),
                    status: .active,
                    date: date,
                    hourlyRate: number(hourlyRate),
                    estimate: estimate,
                    costs: [],
                    activity: [],
                    workStart: nil
                )
            )
        }
        dismiss()
    }
}
