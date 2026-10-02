@preconcurrency import AVFoundation
import Combine
import Foundation

@MainActor
final class AudioRecorderService: NSObject, ObservableObject {
  @Published var isRecording = false
  @Published var duration: TimeInterval = 0
  @Published var level: Float = 0
  @Published var permissionDenied = false

  private var recorder: AVAudioRecorder?
  private var meterTask: Task<Void, Never>?
  private var completion: ((URL?, TimeInterval) -> Void)?

  private func requestPermission() async -> Bool {
    await withCheckedContinuation { continuation in
      AVAudioApplication.requestRecordPermission { granted in
        continuation.resume(returning: granted)
      }
    }
  }

  func start(completion: @escaping (URL?, TimeInterval) -> Void) {
    self.completion = completion

    Task { @MainActor [weak self] in
      guard let self else { return }
      let granted = await self.requestPermission()
      self.permissionDenied = !granted
      guard granted else {
        self.completion = nil
        return
      }
      self.beginRecording()
    }
  }

  private func beginRecording() {
    do {
      let session = AVAudioSession.sharedInstance()
      try session.setCategory(
        .playAndRecord,
        mode: .spokenAudio,
        options: [.defaultToSpeaker, .allowBluetoothHFP]
      )
      try session.setActive(true)

      let url = FileManager.default.temporaryDirectory.appendingPathComponent(
        "voice-\(UUID().uuidString).m4a"
      )

      let settings: [String: Any] = [
        AVFormatIDKey: Int(kAudioFormatMPEG4AAC),
        AVSampleRateKey: 44_100,
        AVNumberOfChannelsKey: 1,
        AVEncoderAudioQualityKey: AVAudioQuality.high.rawValue,
      ]

      let recorder = try AVAudioRecorder(url: url, settings: settings)
      recorder.isMeteringEnabled = true
      recorder.prepareToRecord()
      guard recorder.record() else {
        let callback = completion
        completion = nil
        callback?(nil, 0)
        return
      }

      self.recorder = recorder
      isRecording = true
      duration = 0
      level = -60

      meterTask?.cancel()
      meterTask = Task { @MainActor [weak self] in
        while let self, self.isRecording, !Task.isCancelled {
          guard let recorder = self.recorder else { break }
          recorder.updateMeters()
          self.duration = recorder.currentTime
          self.level = recorder.averagePower(forChannel: 0)
          try? await Task.sleep(for: .milliseconds(80))
        }
      }
    } catch {
      let callback = completion
      completion = nil
      callback?(nil, 0)
    }
  }

  func stop() {
    guard let recorder else { return }

    let url = recorder.url
    let value = recorder.currentTime

    recorder.stop()
    meterTask?.cancel()
    meterTask = nil
    self.recorder = nil
    isRecording = false
    duration = value
    level = -60

    try? AVAudioSession.sharedInstance().setActive(
      false,
      options: .notifyOthersOnDeactivation
    )

    let callback = completion
    completion = nil
    callback?(url, value)
  }
}
