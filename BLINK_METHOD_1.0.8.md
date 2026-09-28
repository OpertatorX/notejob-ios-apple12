# OX Invoice 1.0.8 - BLINK release method

The previous direct-Xcode release path required manual GitHub secrets for:
APPLE_TEAM_ID, certificate, certificate password, provisioning profile and ASC key.

That was not the final BLINK workflow.

BLINK build 12 used:
- GitHub macOS-26
- Xcode 26.4.1
- EXPO_TOKEN
- `eas build --local --non-interactive`
- EAS-managed Apple signing credentials
- EAS Submit for App Store Connect

OX Invoice 1.0.8 now follows that model.

Required build secrets:
1. EXPO_TOKEN
2. EXPO_PUBLIC_IAPKIT_API_KEY (OX Invoice-specific because it sells subscriptions)

No manual p12/mobileprovision/ASC-key file is requested for the build path.
For a brand-new bundle ID, EAS may still need a one-time Apple/EAS credential setup if
no provisioning profile exists yet; that setup is handled through EAS rather than by
manually hunting certificate files.
