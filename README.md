# OX Invoice 1.0

OX Invoice is a premium iOS app for freelancers, solo contractors and small businesses who want to create professional estimates and invoices without a heavy accounting suite.

## Product promise

**Client -> Estimate -> Accepted -> Invoice -> Paid**

The app is deliberately small, fast and local-first. A new account starts completely empty: no fake revenue, no demo clients and no sample documents.

## Included in 1.0

- Estimates and invoices
- Estimate -> invoice conversion
- Client directory and recent-client shortcuts
- Persistent reusable service catalog, populated automatically from document line items
- Quantity, rate, discount, tax, deposit and due date
- Draft, sent, accepted, paid and overdue states
- Duplicate existing document
- Permanent sequential EST/INV numbering
- Business profile, custom business logo, tax ID and payment instructions
- EUR, USD, GBP and CHF
- French and English UI
- Three PDF designs: Classic, Modern and Minimal, with no app watermark
- Native PDF export/share with clean filenames such as `INV-0001.pdf`
- Local-first persistence with SQLite key/value storage
- No ads and no analytics SDK
- 3 complete documents free, then OX Invoice Pro
- OX Invoice Pro: 6 months + yearly auto-renewable subscriptions
- Purchase verification through IAPKit before Pro access is granted
- FR + en-US App Store metadata, privacy pages, terms, support and review notes

## Monetization

Bundle ID: `com.operatorx.oxinvoice`

Products:

- `com.operatorx.oxinvoice.pro.6months` - 6 months - target 9.99 EUR
- `com.operatorx.oxinvoice.pro.yearly` - 1 year - target 16.99 EUR

The App Store price returned by StoreKit is always used in the paywall.

## Windows QA

From the project folder:

```powershell
PowerShell -ExecutionPolicy Bypass -File ".\scripts\QA_OX_INVOICE.ps1"
```

The script installs dependencies when needed, runs the TypeScript typecheck, core logic tests, OX Invoice audit and Expo Doctor.

## Release pipeline

OX Invoice is wired into the OperatorX Factory pipeline: Windows -> GitHub Actions macOS/Xcode -> native IPA -> App Store Connect.

Once Apple/IAP secrets and the repository are configured:

```powershell
PowerShell -ExecutionPolicy Bypass -File ".\scripts\RELEASE.ps1"
```

The release script preserves state and skips completed stages when rerun.

## Account-bound setup still required

See `IAP_SETUP.md`. The only production work that cannot be safely pre-filled in source is the App Store subscription setup, the IAPKit publishable key, Apple/GitHub signing secrets and one real Sandbox purchase/restore test on an iPhone.

## iOS identity

The release includes a custom 1024x1024 RGB iOS icon and matching splash artwork in `assets/`. No generated mockup or demo content is shipped in the runtime.

## PDF quality

See `PDF_QUALITY.md`. The renderer is designed around real A4 output, safe escaping, repeated table headers, multi-page flow and optional payment instructions rather than a screenshot converted to PDF.

## Production hardening

The final packaging pass closes the paywall automatically after a verified purchase, preserves monetization state when business data is deleted, exposes Privacy/Terms/Support directly in the app, and keeps the runtime PDF preview closer to the exported document.
