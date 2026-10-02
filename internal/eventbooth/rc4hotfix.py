from pathlib import Path

p = Path("/tmp/eventbooth-src/EventBooth/Features/CreateEvent/CreateEventView.swift")
s = p.read_text()
old = '''  private var detailsStep: some View {
    ScrollView {
      VStack(alignment: .leading, spacing: 20) {
        header("create.details.title", "create.details.subtitle")

        PhotosPicker(selection: $photoItem, matching: .images) {
          ZStack {
            if let coverData, let image = UIImage(data: coverData) {'''
new = '''  private var detailsStep: some View {
    let previewData = coverData

    return ScrollView {
      VStack(alignment: .leading, spacing: 20) {
        header("create.details.title", "create.details.subtitle")

        PhotosPicker(selection: $photoItem, matching: .images) {
          ZStack {
            if let previewData, let image = UIImage(data: previewData) {'''
if old not in s:
    raise SystemExit("CreateEvent warning hotfix anchor missing")
p.write_text(s.replace(old, new, 1))

p = Path("/tmp/eventbooth-src/EventBooth/Features/Settings/SettingsView.swift")
s = p.read_text()
old = '''  var body: some View {
    NavigationStack {
      ScrollView {
        VStack(alignment: .leading, spacing: 18) {
          PhotosPicker(selection: $photoItem, matching: .images) {
            ZStack {
              if let coverData, let image = UIImage(data: coverData) {
                Image(uiImage: image)
                  .resizable()
                  .scaledToFill()
              } else if let event = store.event(id: eventID) {
                LocalImage(image: store.coverImage(for: event))'''
new = '''  var body: some View {
    let previewData = coverData
    let existingCover = store.event(id: eventID).map { store.coverImage(for: $0) }

    return NavigationStack {
      ScrollView {
        VStack(alignment: .leading, spacing: 18) {
          PhotosPicker(selection: $photoItem, matching: .images) {
            ZStack {
              if let previewData, let image = UIImage(data: previewData) {
                Image(uiImage: image)
                  .resizable()
                  .scaledToFill()
              } else if let existingCover {
                LocalImage(image: existingCover)'''
if old not in s:
    raise SystemExit("Settings warning hotfix anchor missing")
p.write_text(s.replace(old, new, 1))

p = Path("/tmp/eventbooth-src/project.yml")
s = p.read_text().replace("CURRENT_PROJECT_VERSION: 4", "CURRENT_PROJECT_VERSION: 5")
p.write_text(s)
