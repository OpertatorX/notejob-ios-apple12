# OX Invoice 1.0.9 - Existing BLINK Expo token reuse

This release fixes the 1.0.8 behavior that asked for `EXPO_TOKEN` again when the new OX Invoice repository did not contain it.

The successful OperatorX BLINK-style setup already has `EXPO_TOKEN` in an existing credential-host repository. GitHub repository secrets cannot be read back or copied automatically. Instead, this release:

1. Finds an existing credential-host repository containing `EXPO_TOKEN` (`notejob-ios-apple12` first, then `blink-reflex-ios`).
2. Keeps OX Invoice in its own repository `OpertatorX/ox-invoice-ios`.
3. Mirrors the exact OX source to an isolated `ox-invoice-release` branch in the credential-host repo.
4. Installs a dedicated workflow on the credential-host default branch.
5. Runs macOS 26 / Xcode 26.4.1 / `eas build --local` there, so the existing `EXPO_TOKEN` is used without asking for or exposing its value.
6. Preserves the IPA as a GitHub artifact and runs EAS Submit from the same credential-host workflow.

OX Invoice still needs its own IAPKit publishable key because, unlike BLINK, it contains paid subscriptions. That is the only app-specific build key this script may request once.
