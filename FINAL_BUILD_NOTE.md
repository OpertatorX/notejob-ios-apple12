# OX Invoice 1.0 - Production-ready source

This package contains the final no-demo application source for the first iOS release.

Locked product decisions:
- Free download.
- First 3 created documents free.
- OX Invoice Pro: 9.99 EUR / 6 months or 16.99 EUR / year (App Store localized price is authoritative).
- No ads, no analytics, no account requirement.
- Local-first business/client/service/document storage.
- English (US) + French.
- Classic / Modern / Minimal A4 PDF exports.
- Custom 1024x1024 RGB iOS icon.

Production hardening added in the final pass:
- Verified purchase success returns to the interrupted creation flow automatically.
- Deleting business content cannot reset the free-use counter or Pro entitlement.
- Privacy, Terms and Support are available directly from the app.
- Runtime document preview shows issue/due/validity dates to better match the exported PDF.
- No runtime demo/sample content.
