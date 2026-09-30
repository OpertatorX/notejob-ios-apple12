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
            header
            ScrollView(showsIndicators: false) {
                formContent
                    .padding(.horizontal, 18)
                    .padding(.bottom, 24)
            }
        }
        .background(Color.white)
        .onAppear {
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.35) {
                amountFocused = true
            }
        }
    }

    private var header: some View {
        HStack {
            Color.clear.frame(width: 30, height: 30)
            Spacer()
            Text("Add Cost")
                .font(.system(size: 17, weight: .bold))
            Spacer()
            Button { dismiss() } label: {
                Image(systemName: "xmark")
                    .font(.system(size: 13, weight: .bold))
                    .foregroundStyle(Color.primary)
                    .frame(width: 30, height: 30)
                    .background(Color.jpSoft, in: Circle())
            }
            .buttonStyle(.plain)
        }
        .padding(.horizontal, 18)
        .padding(.top, 18)
        .padding(.bottom, 16)
    }

    private var formContent: some View {
        VStack(spacing: 18) {
            categorySelector
            amountSection
            dateSection
            noteSection
            impactSection
            saveButton
        }
    }

    private var categorySelector: some View {
        HStack(spacing: 8) {
            ForEach(CostType.allCases) { item in
                categoryButton(item)
            }
        }
    }

    private func categoryButton(_ item: CostType) -> some View {
        let selected = type == item
        return Button {
            withAnimation(.easeOut(duration: 0.15)) {
                type = item
            }
        } label: {
            VStack(spacing: 7) {
                Image(systemName: item.systemImage)
                    .font(.system(size: 18, weight: .semibold))
                Text(item.title)
                    .font(.system(size: item == .subcontract ? 9 : 10, weight: .medium))
                    .lineLimit(1)
                    .minimumScaleFactor(0.75)
            }
            .foregroundStyle(selected ? Color.white : Color.jpTextSecondary)
            .frame(maxWidth: .infinity)
            .frame(height: 68)
            .background(
                selected ? Color.jpBlue : Color.jpSoft,
                in: RoundedRectangle(cornerRadius: 13, style: .continuous)
            )
        }
        .buttonStyle(.plain)
    }

    private var amountSection: some View {
        VStack(spacing: 8) {
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
        }
    }

    private var dateSection: some View {
        VStack(spacing: 8) {
            fieldLabel("Date")
            DatePicker("", selection: $date, displayedComponents: .date)
                .labelsHidden()
                .datePickerStyle(.compact)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.horizontal, 12)
                .frame(height: 48)
                .background(Color.jpSoft, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
        }
    }

    private var noteSection: some View {
        VStack(spacing: 8) {
            fieldLabel("Note (optional)")
            TextField("Add a note…", text: $note, axis: .vertical)
                .lineLimit(2...3)
                .font(.system(size: 14))
                .padding(13)
                .frame(minHeight: 68, alignment: .topLeading)
                .background(Color.jpSoft, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
        }
    }

    @ViewBuilder
    private var impactSection: some View {
        if let job = store.job(jobID), parsedAmount > 0 {
            let nextProfit = job.profit - parsedAmount
            let nextMargin = job.revenue > 0 ? nextProfit / job.revenue * 100 : 0
            HStack {
                VStack(alignment: .leading, spacing: 3) {
                    Text("AFTER THIS COST")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundStyle(Color.secondary)
                    Text("\(store.money(nextProfit)) profit")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundStyle(Color.jpGreen)
                }
                Spacer()
                Text(String(format: "%.1f%% margin", nextMargin))
                    .font(.system(size: 12, weight: .medium))
                    .foregroundStyle(Color.secondary)
            }
            .padding(14)
            .background(Color.jpSoft, in: RoundedRectangle(cornerRadius: 13, style: .continuous))
        }
    }

    private var saveButton: some View {
        JPPrimaryButton(title: "Add Cost") { save() }
            .opacity(parsedAmount > 0 ? 1 : 0.45)
            .disabled(parsedAmount <= 0)
            .padding(.top, 2)
    }

    private func fieldLabel(_ value: String) -> some View {
        Text(value)
            .font(.system(size: 13, weight: .medium))
            .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func save() {
        guard parsedAmount > 0 else { return }
        store.addCost(
            jobID: jobID,
            type: type,
            amount: parsedAmount,
            date: date,
            note: note
        )
        dismiss()
    }
}
