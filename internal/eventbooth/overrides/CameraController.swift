@preconcurrency import AVFoundation
import SwiftUI
import UIKit

final class CameraController: NSObject, ObservableObject, @unchecked Sendable {
  let session = AVCaptureSession()
  @Published var permissionDenied = false
  @Published var isRunning = false
  @Published var isRecording = false
  @Published var recordingDuration: TimeInterval = 0

  private let photoOutput = AVCapturePhotoOutput()
  private let movieOutput = AVCaptureMovieFileOutput()
  private let queue = DispatchQueue(label: "com.operatorx.eventbooth.camera")
  private var currentInput: AVCaptureDeviceInput?
  private var photoCompletion: ((Data?) -> Void)?
  private var videoCompletion: ((URL?, TimeInterval) -> Void)?
  private var recordStartedAt: Date?
  private var timer: Timer?
  var prefersFrontCamera = true
  private var includesAudio = false

  func requestAndStart(includeAudio: Bool = false) {
    includesAudio = includeAudio
    switch AVCaptureDevice.authorizationStatus(for: .video) {
    case .authorized:
      requestAudioIfNeededThenStart()
    case .notDetermined:
      AVCaptureDevice.requestAccess(for: .video) { [weak self] granted in
        DispatchQueue.main.async {
          if granted {
            self?.requestAudioIfNeededThenStart()
          } else {
            self?.permissionDenied = true
          }
        }
      }
    default:
      DispatchQueue.main.async { [weak self] in self?.permissionDenied = true }
    }
  }

  private func requestAudioIfNeededThenStart() {
    guard includesAudio else {
      configureAndStart()
      return
    }
    switch AVCaptureDevice.authorizationStatus(for: .audio) {
    case .authorized:
      configureAndStart()
    case .notDetermined:
      AVCaptureDevice.requestAccess(for: .audio) { [weak self] granted in
        DispatchQueue.main.async {
          if granted {
            self?.configureAndStart()
          } else {
            self?.permissionDenied = true
          }
        }
      }
    default:
      permissionDenied = true
    }
  }

  func configureAndStart() {
    queue.async { [weak self] in
      guard let self else { return }
      session.beginConfiguration()
      session.sessionPreset = .high
      session.inputs.forEach(session.removeInput)
      session.outputs.forEach(session.removeOutput)

      let position: AVCaptureDevice.Position = prefersFrontCamera ? .front : .back
      let device =
        AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: position)
        ?? AVCaptureDevice.default(for: .video)
      guard let device, let input = try? AVCaptureDeviceInput(device: device),
        session.canAddInput(input)
      else {
        session.commitConfiguration()
        return
      }
      session.addInput(input)
      currentInput = input
      if includesAudio,
        let audioDevice = AVCaptureDevice.default(for: .audio),
        let audioInput = try? AVCaptureDeviceInput(device: audioDevice),
        session.canAddInput(audioInput)
      {
        session.addInput(audioInput)
      }
      if session.canAddOutput(photoOutput) { session.addOutput(photoOutput) }
      if session.canAddOutput(movieOutput) { session.addOutput(movieOutput) }
      session.commitConfiguration()
      session.startRunning()
      DispatchQueue.main.async { [weak self] in self?.isRunning = true }
    }
  }

  func stop() {
    queue.async { [weak self] in
      guard let self else { return }
      if session.isRunning { session.stopRunning() }
      DispatchQueue.main.async { [weak self] in self?.isRunning = false }
    }
  }

  func switchCamera() {
    prefersFrontCamera.toggle()
    stop()
    configureAndStart()
  }

  func capturePhoto(completion: @escaping (Data?) -> Void) {
    photoCompletion = completion
    let settings = AVCapturePhotoSettings()
    settings.flashMode = .off
    photoOutput.capturePhoto(with: settings, delegate: self)
  }

  func startVideo(completion: @escaping (URL?, TimeInterval) -> Void) {
    guard !movieOutput.isRecording else { return }
    videoCompletion = completion
    let url = FileManager.default.temporaryDirectory.appendingPathComponent(
      "eventbooth-\(UUID().uuidString).mov")
    try? FileManager.default.removeItem(at: url)
    recordStartedAt = .now
    movieOutput.startRecording(to: url, recordingDelegate: self)
    DispatchQueue.main.async { [weak self] in
      self?.isRecording = true
      self?.recordingDuration = 0
      self?.timer?.invalidate()
      self?.timer = Timer.scheduledTimer(withTimeInterval: 0.2, repeats: true) { [weak self] _ in
        guard let self, let started = self.recordStartedAt else { return }
        self.recordingDuration = Date().timeIntervalSince(started)
      }
    }
  }

  func stopVideo() {
    guard movieOutput.isRecording else { return }
    movieOutput.stopRecording()
  }
}

extension CameraController: AVCaptureFileOutputRecordingDelegate {
  func fileOutput(
    _ output: AVCaptureFileOutput, didFinishRecordingTo outputFileURL: URL,
    from connections: [AVCaptureConnection], error: Error?
  ) {
    let duration = recordStartedAt.map { Date().timeIntervalSince($0) } ?? 0
    DispatchQueue.main.async { [weak self] in
      guard let self else { return }
      self.timer?.invalidate()
      self.timer = nil
      self.isRecording = false
      let completion = self.videoCompletion
      self.videoCompletion = nil
      completion?(error == nil ? outputFileURL : nil, duration)
    }
  }
}

extension CameraController: AVCapturePhotoCaptureDelegate {
  nonisolated func photoOutput(
    _ output: AVCapturePhotoOutput, didFinishProcessingPhoto photo: AVCapturePhoto, error: Error?
  ) {
    let data = error == nil ? photo.fileDataRepresentation() : nil
    DispatchQueue.main.async { [weak self] in
      let completion = self?.photoCompletion
      self?.photoCompletion = nil
      completion?(data)
    }
  }
}

struct CameraPreview: UIViewRepresentable {
  let session: AVCaptureSession

  func makeUIView(context: Context) -> PreviewView {
    let view = PreviewView()
    view.layerPreview.session = session
    view.layerPreview.videoGravity = .resizeAspectFill
    return view
  }

  func updateUIView(_ uiView: PreviewView, context: Context) {
    uiView.layerPreview.session = session
  }

  final class PreviewView: UIView {
    override class var layerClass: AnyClass { AVCaptureVideoPreviewLayer.self }
    var layerPreview: AVCaptureVideoPreviewLayer { layer as! AVCaptureVideoPreviewLayer }
  }
}
