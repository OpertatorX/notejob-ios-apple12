# START HERE - OX Invoice

The app source is finished. You do not need to redesign screens or rebuild the PDF system.

## First run on Windows

Open PowerShell in the extracted OX Invoice folder and run:

```powershell
PowerShell -ExecutionPolicy Bypass -File ".\scripts\QA_OX_INVOICE.ps1"
```

This installs the JavaScript dependencies and runs the complete local QA sequence.

## Before the production build

Only account-bound configuration remains:

1. Create the two OX Invoice Pro subscriptions in App Store Connect (see `IAP_SETUP.md`).
2. Add the IAPKit publishable key to the GitHub secret `EXPO_PUBLIC_IAPKIT_API_KEY`.
3. Make sure the usual OperatorX Apple signing/App Store Connect GitHub secrets are available.

Then run:

```powershell
PowerShell -ExecutionPolicy Bypass -File ".\scripts\RELEASE.ps1"
```

The Factory performs the source freeze, Git push, macOS/Xcode build, IPA download, Apple upload and metadata steps. App Store screenshots are intentionally not faked from the concept board; capture them from the final runtime before review.

## Final human checks

- One Sandbox purchase + restore on a physical iPhone.
- One PDF export for Classic / Modern / Minimal from that final build.
- App Privacy in App Store Connect, then submit for review.

Everything else is already in the project.
