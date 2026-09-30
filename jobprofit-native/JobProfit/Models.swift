import Foundation

enum JobStatus: String, Codable, CaseIterable, Identifiable {
    case active, completed
    var id: String { rawValue }
    var title: String { rawValue.capitalized }
}

enum CostType: String, Codable, CaseIterable, Identifiable {
    case labor, materials, travel, subcontract, other
    var id: String { rawValue }
    var title: String {
        switch self {
        case .labor: "Labor"
        case .materials: "Materials"
        case .travel: "Travel"
        case .subcontract: "Subcontract"
        case .other: "Other"
        }
    }
    var systemImage: String {
        switch self {
        case .labor: "person.fill"
        case .materials: "shippingbox.fill"
        case .travel: "car.fill"
        case .subcontract: "person.2.fill"
        case .other: "ellipsis.circle.fill"
        }
    }
}

enum ActivityKind: String, Codable {
    case start, labor, materials, complete, reopen, other
}

struct JobCost: Codable, Identifiable, Hashable {
    var id = UUID()
    var type: CostType
    var amount: Double
    var date: Date
    var note: String
}

struct ActivityEntry: Codable, Identifiable, Hashable {
    var id = UUID()
    var kind: ActivityKind
    var title: String
    var date: Date
    var value: String
}

struct JobEstimate: Codable, Hashable {
    var labor: Double = 0
    var materials: Double = 0
    var travel: Double = 0
    var subcontract: Double = 0
    var other: Double = 0

    var total: Double { labor + materials + travel + subcontract + other }
    subscript(type: CostType) -> Double {
        switch type {
        case .labor: labor
        case .materials: materials
        case .travel: travel
        case .subcontract: subcontract
        case .other: other
        }
    }
}

struct Job: Codable, Identifiable, Hashable {
    var id = UUID()
    var name: String
    var client: String
    var type: String
    var revenue: Double
    var status: JobStatus
    var date: Date
    var hourlyRate: Double
    var estimate: JobEstimate
    var costs: [JobCost]
    var activity: [ActivityEntry]
    var workStart: Date?

    var costTotal: Double { costs.reduce(0) { $0 + $1.amount } }
    var profit: Double { revenue - costTotal }
    var margin: Double { revenue > 0 ? profit / revenue * 100 : 0 }
    var estimatedProfit: Double { revenue - estimate.total }
    var estimatedMargin: Double { revenue > 0 ? estimatedProfit / revenue * 100 : 0 }

    func costTotal(for type: CostType) -> Double {
        costs.filter { $0.type == type }.reduce(0) { $0 + $1.amount }
    }
}

struct AppSettings: Codable, Hashable {
    var currency = "USD"
    var appearance = "light"
    var categories = ["Kitchen remodel", "Deck installation", "Bathroom renovation", "Interior painting", "Flooring"]
}

struct AppData: Codable {
    var jobs: [Job]
    var settings: AppSettings
}
