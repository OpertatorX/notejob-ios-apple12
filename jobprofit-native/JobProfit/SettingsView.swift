import SwiftUI

struct SettingsView: View {
    @EnvironmentObject private var store: JobStore
    @Environment(\.dismiss) private var dismiss
    @State private var showReset = false

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
                    Text("Settings")
                        .font(.system(size: 17, weight: .bold))
                    Spacer()
                    Color.clear.frame(width: 34, height: 34)
                }
                .padding(.bottom, 16)

                HStack(spacing: 12) {
                    ZStack {
                        Circle().fill(Color.jpSoft).frame(width: 44, height: 44)
                        Image(systemName: "person.fill")
                            .font(.system(size: 18, weight: .semibold))
                            .foregroundStyle(.secondary)
                    }
                    VStack(alignment: .leading, spacing: 2) {
                        Text("John Smith")
                            .font(.system(size: 15, weight: .semibold))
                        Text("john@jobprofit.app")
                            .font(.system(size: 11))
                            .foregroundStyle(.secondary)
                    }
                    Spacer()
                }
                .padding(.bottom, 15)

                VStack(alignment: .leading, spacing: 9) {
                    Text("JobProfit Pro")
                        .font(.system(size: 19, weight: .bold))
                        .foregroundStyle(.white)
                    Text("Unlimited jobs, advanced insights and exports.")
                        .font(.system(size: 11))
                        .foregroundStyle(.white.opacity(0.9))
                    Link(destination: URL(string: "https://apps.apple.com/account/subscriptions")!) {
                        Text("Manage Subscription")
                            .font(.system(size: 12, weight: .semibold))
                            .foregroundStyle(Color.jpBlue)
                            .frame(maxWidth: .infinity)
                            .frame(height: 36)
                            .background(Color.white, in: RoundedRectangle(cornerRadius: 9, style: .continuous))
                    }
                }
                .padding(14)
                .background(
                    LinearGradient(
                        colors: [Color.jpBlue, Color(red: 0.09, green: 0.26, blue: 0.94)],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    ),
                    in: RoundedRectangle(cornerRadius: 16, style: .continuous)
                )
                .padding(.bottom, 14)

                VStack(spacing: 0) {
                    NavigationLink { CategoriesView() } label: {
                        settingsRow(icon: "square.grid.2x2", title: "Job Categories")
                    }
                    Divider().padding(.leading, 48)

                    ShareLink(item: store.csv(), subject: Text("JobProfit Export"), message: Text("CSV export from JobProfit")) {
                        settingsRow(icon: "square.and.arrow.up", title: "Export Data")
                    }
                    Divider().padding(.leading, 48)

                    Picker(selection: binding(\.currency)) {
                        ForEach(["USD", "EUR", "GBP", "CAD", "AUD"], id: \.self) { Text($0).tag($0) }
                    } label: {
                        settingsRow(icon: "dollarsign", title: "Currency", value: store.settings.currency, showsChevron: false)
                    }
                    .tint(.secondary)
                    Divider().padding(.leading, 48)

                    Picker(selection: binding(\.appearance)) {
                        Text("Light").tag("light")
                        Text("System").tag("system")
                        Text("Dark").tag("dark")
                    } label: {
                        settingsRow(icon: "circle.lefthalf.filled", title: "Appearance", value: store.settings.appearance.capitalized, showsChevron: false)
                    }
                    .tint(.secondary)
                    Divider().padding(.leading, 48)

                    Link(destination: URL(string: "mailto:support@jobprofit.app?subject=JobProfit%20Support")!) {
                        settingsRow(icon: "questionmark.circle", title: "Help & Support")
                    }
                }
                .padding(.horizontal, 14)
                .background(Color.jpSoft, in: RoundedRectangle(cornerRadius: 16, style: .continuous))

                Button("Reset Demo Data", role: .destructive) { showReset = true }
                    .font(.system(size: 13, weight: .medium))
                    .padding(.top, 26)
            }
            .padding(.horizontal, 18)
            .padding(.top, 8)
            .padding(.bottom, 24)
        }
        .background(Color.white)
        .toolbar(.hidden, for: .navigationBar)
        .confirmationDialog("Reset all local JobProfit data?", isPresented: $showReset, titleVisibility: .visible) {
            Button("Reset", role: .destructive) { store.reset() }
            Button("Cancel", role: .cancel) {}
        }
    }

    @ViewBuilder
    private func settingsRow(icon: String, title: String, value: String? = nil, showsChevron: Bool = true) -> some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.system(size: 14, weight: .semibold))
                .foregroundStyle(.primary)
                .frame(width: 24)
            Text(title)
                .font(.system(size: 14, weight: .medium))
                .foregroundStyle(.primary)
            Spacer()
            if let value {
                Text(value)
                    .font(.system(size: 12))
                    .foregroundStyle(.secondary)
            }
            if showsChevron {
                Image(systemName: "chevron.right")
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundStyle(.tertiary)
            }
        }
        .frame(height: 50)
        .contentShape(Rectangle())
    }

    private func binding<T>(_ keyPath: WritableKeyPath<AppSettings, T>) -> Binding<T> {
        Binding {
            store.settings[keyPath: keyPath]
        } set: { value in
            store.settings[keyPath: keyPath] = value
            store.persist()
        }
    }
}

struct CategoriesView: View {
    @EnvironmentObject private var store: JobStore
    @State private var newCategory = ""

    var body: some View {
        List {
            Section {
                ForEach(store.settings.categories, id: \.self) { Text($0) }
                    .onDelete(perform: store.deleteCategories)
            }
            Section("New category") {
                TextField("e.g. Roofing", text: $newCategory)
                Button("Add Category") {
                    store.addCategory(newCategory)
                    newCategory = ""
                }
                .disabled(newCategory.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
            }
        }
        .scrollContentBackground(.hidden)
        .background(Color.jpBackground)
        .navigationTitle("Job Categories")
        .navigationBarTitleDisplayMode(.inline)
    }
}
