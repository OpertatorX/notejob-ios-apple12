import Foundation
import SwiftUI

@MainActor
final class JobStore: ObservableObject {
    @Published var jobs: [Job]
    @Published var settings: AppSettings

    private let key = "jobprofit.appdata.v2"
    private var isLoading = true

    init() {
        if let data = UserDefaults.standard.data(forKey: key),
           let saved = try? JSONDecoder().decode(AppData.self, from: data) {
            jobs = saved.jobs
            settings = saved.settings
        } else {
            let data = Self.sampleData()
            jobs = data.jobs
            settings = data.settings
        }
        isLoading = false
    }

    func persist() {
        guard !isLoading else { return }
        if let data = try? JSONEncoder().encode(AppData(jobs: jobs, settings: settings)) {
            UserDefaults.standard.set(data, forKey: key)
        }
    }

    func job(_ id: UUID) -> Job? { jobs.first { $0.id == id } }
    func index(_ id: UUID) -> Int? { jobs.firstIndex { $0.id == id } }

    func add(_ job: Job) {
        jobs.append(job)
        persist()
    }

    func update(_ job: Job) {
        guard let i = index(job.id) else { return }
        jobs[i] = job
        persist()
    }

    func delete(_ id: UUID) {
        jobs.removeAll { $0.id == id }
        persist()
    }

    @discardableResult
    func duplicate(_ id: UUID) -> UUID? {
        guard var copy = job(id) else { return nil }
        copy.id = UUID()
        copy.name += " Copy"
        copy.status = .active
        copy.costs = []
        copy.activity = []
        copy.workStart = nil
        jobs.append(copy)
        persist()
        return copy.id
    }

    func addCost(jobID: UUID, type: CostType, amount: Double, date: Date, note: String) {
        guard amount > 0, let i = index(jobID) else { return }
        jobs[i].costs.append(JobCost(type: type, amount: amount, date: date, note: note))
        let activityKind: ActivityKind = switch type {
        case .labor: .labor
        case .materials: .materials
        default: .other
        }
        jobs[i].activity.append(ActivityEntry(kind: activityKind,
                                               title: "+ \(money(amount)) \(type.title.lowercased())",
                                               date: date,
                                               value: ""))
        persist()
    }

    func deleteCost(jobID: UUID, costID: UUID) {
        guard let i = index(jobID) else { return }
        jobs[i].costs.removeAll { $0.id == costID }
        persist()
    }

    func toggleComplete(_ id: UUID) {
        guard let i = index(id) else { return }
        let completed = jobs[i].status == .completed
        jobs[i].status = completed ? .active : .completed
        jobs[i].activity.append(ActivityEntry(kind: completed ? .reopen : .complete,
                                               title: completed ? "Job reopened" : "Job completed",
                                               date: .now,
                                               value: ""))
        persist()
    }

    func startWork(_ id: UUID) {
        guard let i = index(id), jobs[i].workStart == nil else { return }
        jobs[i].workStart = .now
        jobs[i].activity.append(ActivityEntry(kind: .start, title: "Started work", date: .now, value: ""))
        persist()
    }

    @discardableResult
    func stopWork(_ id: UUID, now: Date = .now) -> Double? {
        guard let i = index(id), let start = jobs[i].workStart else { return nil }
        let hours = max(0.1, now.timeIntervalSince(start) / 3600)
        let amount = (hours * jobs[i].hourlyRate * 100).rounded() / 100
        jobs[i].costs.append(JobCost(type: .labor, amount: amount, date: now, note: String(format: "%.2f labor hours", hours)))
        jobs[i].activity.append(ActivityEntry(kind: .labor,
                                               title: String(format: "+ %.2f labor hours", hours),
                                               date: now,
                                               value: money(amount)))
        jobs[i].workStart = nil
        persist()
        return amount
    }

    func jobs(in month: Date) -> [Job] {
        let cal = Calendar.current
        return jobs.filter { cal.isDate($0.date, equalTo: month, toGranularity: .month) }
    }

    func totals(in month: Date) -> (revenue: Double, costs: Double, profit: Double) {
        let list = jobs(in: month)
        let revenue = list.reduce(0) { $0 + $1.revenue }
        let costs = list.reduce(0) { $0 + $1.costTotal }
        return (revenue, costs, revenue - costs)
    }

    func money(_ value: Double) -> String {
        let f = NumberFormatter()
        f.numberStyle = .currency
        f.currencyCode = settings.currency
        let digits = value.rounded() == value ? 0 : 2
        f.minimumFractionDigits = digits
        f.maximumFractionDigits = digits
        return f.string(from: NSNumber(value: value)) ?? String(format: "%.2f", value)
    }

    var currencySymbol: String {
        let f = NumberFormatter()
        f.numberStyle = .currency
        f.currencyCode = settings.currency
        return f.currencySymbol ?? "$"
    }

    func monthChangeText(in month: Date) -> String {
        guard let previous = Calendar.current.date(byAdding: .month, value: -1, to: month) else { return "— vs previous month" }
        let currentRevenue = totals(in: month).revenue
        let previousRevenue = totals(in: previous).revenue
        guard previousRevenue > 0 else { return "— vs previous month" }
        let change = (currentRevenue - previousRevenue) / previousRevenue * 100
        let sign = change >= 0 ? "+" : ""
        return String(format: "%@%.1f%% vs %@", sign, change, previous.formatted(.dateTime.month(.abbreviated)))
    }

    func summary(_ id: UUID) -> String {
        guard let job = job(id) else { return "JobProfit" }
        return "\(job.name): \(money(job.profit)) profit · \(String(format: "%.1f", job.margin))% margin"
    }

    func csv() -> String {
        var rows = ["Job,Client,Type,Status,Revenue,Costs,Profit,Margin,Date"]
        let iso = ISO8601DateFormatter()
        for job in jobs {
            let values = [job.name, job.client, job.type, job.status.rawValue,
                          String(job.revenue), String(job.costTotal), String(job.profit),
                          String(format: "%.1f%%", job.margin), iso.string(from: job.date)]
            rows.append(values.map { "\"\($0.replacingOccurrences(of: "\"", with: "\"\""))\"" }.joined(separator: ","))
        }
        return rows.joined(separator: "\n")
    }

    func addCategory(_ value: String) {
        let trimmed = value.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty, !settings.categories.contains(trimmed) else { return }
        settings.categories.append(trimmed)
        persist()
    }

    func deleteCategories(at offsets: IndexSet) {
        guard settings.categories.count - offsets.count >= 1 else { return }
        settings.categories.remove(atOffsets: offsets)
        persist()
    }

    func reset() {
        let data = Self.sampleData()
        jobs = data.jobs
        settings = data.settings
        persist()
    }

    var preferredScheme: ColorScheme? {
        switch settings.appearance {
        case "light": .light
        case "dark": .dark
        default: nil
        }
    }

    static func sampleData() -> AppData {
        let cal = Calendar(identifier: .gregorian)
        func date(_ y: Int, _ m: Int, _ d: Int, _ h: Int = 12, _ min: Int = 0) -> Date {
            cal.date(from: DateComponents(year: y, month: m, day: d, hour: h, minute: min))!
        }
        func cost(_ type: CostType, _ amount: Double, _ day: Int, _ note: String = "") -> JobCost {
            JobCost(type: type, amount: amount, date: date(2025, 9, day), note: note)
        }
        let miller = Job(name: "Miller Kitchen", client: "Miller Family", type: "Kitchen remodel", revenue: 5000, status: .active, date: date(2025,9,2), hourlyRate: 35,
                         estimate: JobEstimate(labor: 1000, materials: 900, travel: 100, subcontract: 0, other: 150),
                         costs: [cost(.labor,1140,29,"35.5 labor hours"),cost(.materials,980,29,"Cabinet and tile materials"),cost(.travel,160,18),cost(.other,300,15,"Permit and misc.")],
                         activity: [ActivityEntry(kind:.start,title:"Started work",date:date(2025,9,29,8,42),value:""),ActivityEntry(kind:.materials,title:"+ $74 materials",date:date(2025,9,29,11,14),value:""),ActivityEntry(kind:.labor,title:"+ 3.5 labor hours",date:date(2025,9,29,13,50),value:"$122.50"),ActivityEntry(kind:.other,title:"Work day finished",date:date(2025,9,29,16,25),value:"")], workStart:nil)
        let johnson = Job(name:"Johnson Deck",client:"Johnson Family",type:"Deck installation",revenue:3190,status:.active,date:date(2025,9,5),hourlyRate:32,estimate:JobEstimate(labor:900,materials:900,travel:130,subcontract:0,other:90),costs:[cost(.labor,840,20),cost(.materials,900,17),cost(.travel,120,14),cost(.other,150,15)],activity:[],workStart:nil)
        let smith = Job(name:"Smith Bathroom",client:"Smith Family",type:"Bathroom renovation",revenue:2625,status:.active,date:date(2025,9,8),hourlyRate:35,estimate:JobEstimate(labor:900,materials:1100,travel:100,subcontract:0,other:150),costs:[cost(.labor,980,23),cost(.materials,1200,22),cost(.travel,95,20),cost(.other,140,21)],activity:[],workStart:nil)
        let clark = Job(name:"Clark Living Room",client:"Clark",type:"Interior painting",revenue:3000,status:.active,date:date(2025,9,11),hourlyRate:30,estimate:JobEstimate(labor:900,materials:780,travel:100,subcontract:0,other:100),costs:[cost(.labor,920,24),cost(.materials,850,21),cost(.travel,110,20),cost(.other,160,22)],activity:[],workStart:nil)
        let wilson = Job(name:"Wilson Home",client:"Wilson",type:"Flooring",revenue:3510,status:.active,date:date(2025,9,16),hourlyRate:34,estimate:JobEstimate(labor:900,materials:950,travel:100,subcontract:0,other:120),costs:[cost(.labor,880,26),cost(.materials,930,25),cost(.travel,100,24),cost(.other,160,25)],activity:[],workStart:nil)
        let august = Job(name:"August Portfolio",client:"Completed work",type:"Other",revenue:14633,status:.completed,date:date(2025,8,16),hourlyRate:34,estimate:JobEstimate(labor:4000,materials:3900,travel:500,subcontract:0,other:500),costs:[],activity:[],workStart:nil)
        return AppData(jobs:[miller,johnson,smith,clark,wilson,august], settings:AppSettings())
    }
}
