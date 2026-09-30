import SwiftUI

struct AddCostView: View {
    @EnvironmentObject private var store: JobStore
    @Environment(\.dismiss) private var dismiss
    let jobID: UUID

    @State private var type: CostType = .labor
    @State private var amount = ""
    @State private var date = Date()
    @State private var note = ""
    @FocusState private var amountFocused: Bool

    private var parsedAmount: Double {
        Double(amount.replacingOccurrences(of: ",", with: ".")) ?? 0
    }

    var body: some View {
        VStack(spacing: 0) {
            HStack {
                Spacer()
                Text("Add Cost")
                    .font(.system(size: 17, weight: .bold))
                Spacer()
                Button { dismiss() } label: {
                    Image(systemName: "xmark")
                        .font(.system(size: 13, weight: .bold))
                        .foregroundStyle(.primary)
                        .frame(width: 30, height: 30)
                        .background(Color.jpSoft, in: Circle())
                }
                .buttonStyle(.plain)
            }
            .overlay(alignment: .leading) { Color.clear.frame(width: 30, height: 30) }
            .padding(.horizontal, 18)
            .padding(.top, 18)
            .padding(.bottom, 16)

            ScrollView(showsIndicators: false) {
                VStack(spacing: 18) {
                    HStack(spacing: 8) {
                        ForEach(CostType.allCases) { item in
                            Button {
                                withAnimation(.easeOut(duration: 0.15)) { type = item }
                            } label: {
                                VStack(spacing: 7) {
                                    Image(systemName: item.systemImage)
                                        .font(.system(size: 18, weight: .semibold))
                                    Text(item.title == "Subcontract" ? "Subcontract" : item.title)
                                        .font(.system(size: item == .subcontract ? 9 : 10, weight: .medium))
                                        .lineLimit(1)
                                        .minimumScaleFactor(0.75)
                                }
                                .foregroundStyle(type == item ? Color.white : Color.jpTextSecondary)
                                .frame(maxWidth: .infinity)
                                .frame(height: 68)
                                .background(type == item ? Color.jpBlue : Color.jpSoft, in: RoundedRectangle(cornerRadius: 13, style: .continuous))
                            }
                            .buttonStyle(.plain)
                        }
                    }

                    fieldLabel("Amount")
                    HStack(spacing: 10) {
                        Text(store.currencySymbol)
                            .font(.system(size: 16, weight: .medium))
                        TextField("0.00", text: $amount)
                            .keyboardType(.decimalPad)
                            .focused($amountFocused)
                            .font(.system(size: 16, weight: .medium))
                    }
                    .padding(.horizontal, 14)
                    .frame(height: 48)
                    .background(Color.jpSoft, in: RoundedRectangle(cornerRadius: 12, style: .continuous))

                    fieldLabel("Date")
                    DatePicker("", selection: $date, displayedComponents: .date)
                        .labelsHidden()
                        .datePickerStyle(.compact)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(.horizontal, 12)
                        .frame(height: 48)
                        .background(Color.jpSoft, in: RoundedRectangle(cornerRadius: 12, style: .continuous))

                    fieldLabel("Note (optional)")
                    TextField("Add a note…", text: $note, axis: .vertical)
                        .lineLimit(2...3)
                        .font(.system(size: 14))
                        .padding(13)
                        .frame(minHeight: 68, alignment: .topLeading)
                        .background(Color.jpSoft, in: RoundedRectangle(cornerRadius: 12, style: .continuous))

                    if let job = store.job(jobID), parsedAmount > 0 {
                        HStack {
                            VStack(alignment: .leading, spacing: 3) {
                                Text("AFTER THIS COST")
                                    .font(.system(size: 10, weight: .bold))
                                    .foregroundStyle(.secondary)
                                Text("\(store.money(job.profit - parsedAmount)) profit")
                                    .font(.system(size: 16, weight: .bold))
                                    .foregroundStyle(.jpGreen)
                            }
                            Spacer()
                            let margin = job.revenue > 0 ? (job.profit - parsedAmount) / job.revenue * 100 : 0
                            Text(String(format: "%.1f%% margin", margin))
                                .font(.system(size: 12, weight: .medium))
                                .foregroundStyle(.secondary)
                        }
                        .padding(14)
                        .background(Color.jpSoft, in: RoundedRectangle(cornerRadius: 13, style: .continuous))
                    }

                    JPPrimaryButton(title: "Add Cost") { save() }
                        .opacity(parsedAmount > 0 ? 1 : 0.45)
                        .disabled(parsedAmount <= 0)
                        .padding(.top, 2)
                }
                .padding(.horizontal, 18)
                .padding(.bottom, 24)
            }
        }
        .background(Color.white)
        .onAppear {
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.35) { amountFocused = true }
        }
    }

    @ViewBuilder
    private func fieldLabel(_ value: String) -> some View {
        Text(value)
            .font(.system(size: 13, weight: .medium))
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.bottom, -10)
    }

    private func save() {
        guard parsedAmount > 0 else { return }
        store.addCost(jobID: jobID, type: type, amount: parsedAmount, date: date, note: note)
        dismiss()
    }
}
