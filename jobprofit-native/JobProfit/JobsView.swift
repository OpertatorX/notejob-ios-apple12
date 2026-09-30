import SwiftUI

struct JobsView: View {
    private enum Filter: String, CaseIterable, Hashable {
        case all = "All"
        case active = "Active"
        case completed = "Completed"
    }

    @EnvironmentObject private var store: JobStore
    @Binding var month: Date
    @State private var filter: Filter = .all
    @State private var search = ""
    @State private var showingNewJob = false

    private var filtered: [Job] {
        store.jobs(in: month)
            .filter { job in
                let statusOK: Bool = switch filter {
                case .all: true
                case .active: job.status == .active
                case .completed: job.status == .completed
                }
                let haystack = "\(job.name) \(job.client) \(job.type)".lowercased()
                let searchOK = search.isEmpty || haystack.contains(search.lowercased())
                return statusOK && searchOK
            }
            .sorted { $0.date > $1.date }
    }

    var body: some View {
        ZStack(alignment: .bottomTrailing) {
            ScrollView(showsIndicators: false) {
                VStack(spacing: 0) {
                    JPPageHeader("Jobs") {
                        ShareLink(item: summaryText) {
                            Image(systemName: "square.and.arrow.up")
                                .font(.system(size: 16, weight: .semibold))
                                .foregroundStyle(.primary)
                                .frame(width: 34, height: 34)
                                .background(Color.jpSoft, in: Circle())
                        }
                        .buttonStyle(.plain)
                    }
                    .padding(.bottom, 12)

                    JPSegmentedControl(
                        items: Filter.allCases.map { ($0, $0.rawValue) },
                        selection: $filter
                    )
                    .padding(.bottom, 10)

                    JPSearchField(text: $search)
                        .padding(.bottom, 12)

                    LazyVStack(spacing: 0) {
                        if filtered.isEmpty {
                            ContentUnavailableView.search(text: search)
                                .padding(.top, 70)
                        } else {
                            ForEach(Array(filtered.enumerated()), id: \.element.id) { index, job in
                                NavigationLink {
                                    JobDetailView(jobID: job.id)
                                } label: {
                                    JPJobRow(job: job, showsProgress: true)
                                }
                                .buttonStyle(.plain)

                                if index < filtered.count - 1 {
                                    Divider().opacity(0.7)
                                }
                            }
                        }
                    }
                    .padding(.bottom, 84)
                }
                .padding(.horizontal, 18)
                .padding(.top, 8)
            }
            .background(Color.white)

            Button {
                showingNewJob = true
            } label: {
                HStack(spacing: 8) {
                    Image(systemName: "plus")
                        .font(.system(size: 16, weight: .semibold))
                    Text("Job")
                        .font(.system(size: 15, weight: .semibold))
                }
                .foregroundStyle(.white)
                .padding(.horizontal, 18)
                .frame(height: 50)
                .background(Color.jpBlue, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
                .shadow(color: Color.jpBlue.opacity(0.23), radius: 12, y: 5)
            }
            .buttonStyle(.plain)
            .padding(.trailing, 18)
            .padding(.bottom, 16)
        }
        .toolbar(.hidden, for: .navigationBar)
        .sheet(isPresented: $showingNewJob) {
            NavigationStack {
                JobFormView()
            }
            .presentationBackground(Color.jpBackground)
        }
    }

    private var summaryText: String {
        let totals = store.totals(in: month)
        return "JobProfit \(month.formatted(.dateTime.month(.wide).year())) — \(store.money(totals.revenue)) revenue · \(store.money(totals.profit)) profit"
    }
}
