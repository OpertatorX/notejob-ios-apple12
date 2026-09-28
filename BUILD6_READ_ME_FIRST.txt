NOTEJOB 1.0.0 BUILD 6 - FINAL ICON RELEASE

THIS ZIP IS THE COMPLETE PROJECT, NOT A PATCH.

Locked identity:
- Bundle: com.operatorx.notejob
- Version: 1.0.0
- Build: 6
- App Store Connect ID: 6814423903
- GitHub repo: notejob-ios-apple12

Locked icon:
- assets\icon.png
- 1024x1024 RGB PNG
- SHA256: ec370ae9247a4d23adb06d41897ce16b0a313c835c69754bb40b9df7e1bee779
- Visual: ivory buildings + star on green background
- The old NJ monogram is NOT the release icon.

Run:
  START_NOTEJOB_BUILD6.bat

The release script:
1. validates Build 6 + icon hash,
2. reuses the existing Expo project/session,
3. force-pushes the verified Build 6 source to the existing GitHub repo,
4. builds on macOS 26 / Xcode 26.4.1 with EAS --local,
5. downloads NoteJob-1.0.0-build6-PRODUCTION.ipa,
6. installs local npm dependencies only if needed for EAS Submit,
7. uploads that IPA to App Store Connect.

Do not select Build 5 for review. Select Build 6 after Apple processing.
