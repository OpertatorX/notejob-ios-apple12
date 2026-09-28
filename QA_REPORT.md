# OX Invoice 1.0 - Final source QA report

## Verified in the packaging workspace

- Core business logic: **9/9 PASS**
- Product/config audit: **42/42 PASS**
- TypeScript/TSX syntax parse: **PASS**
- Cross-file strict TypeScript check with local dependency interface stubs: **PASS**
- Fresh install state: 0 documents, 0 clients, 0 saved services, 0 revenue
- Free tier: exactly 3 created documents before Pro gate
- Estimate -> invoice conversion and permanent numbering logic: tested
- Persistent service migration/catalog logic: tested
- Financial math: discount, tax, deposit, balance: tested
- A4 PDF HTML escaping, pagination rules, 3 templates and payment instructions: tested
- PDF output contains no OX Invoice watermark
- Custom 1024x1024 RGB iOS icon present
- No AdMob / no analytics SDK
- FR + en-US metadata, support, terms, privacy and review notes present

## Previously verified on the Windows release machine

The pre-final codebase passed the real installed-dependency QA: TypeScript typecheck, core tests, **40/40 product checks**, and **21/21 Expo Doctor**. The final source keeps that base and adds the service catalog, client/service search ergonomics, payment instructions, data deletion and the new branding/icon.

## One final machine check

Run once after extraction:

```powershell
PowerShell -ExecutionPolicy Bypass -File ".\scripts\QA_OX_INVOICE.ps1"
```

This is the authoritative installed-dependency check before build.

## Account/device-bound checks before App Review

1. Create the two App Store subscriptions and configure the IAPKit publishable key.
2. Run one Sandbox purchase + restore on a physical iPhone.
3. Export one Classic, Modern and Minimal PDF from the final iPhone build and visually inspect them.
4. Deploy the included legal/support site and place the final URLs in App Store Connect.
5. Capture real App Store screenshots from the final runtime.

No demo data or fake runtime screenshots are included in the application.

## Production hardening pass

- Purchase success now returns automatically from the paywall to the interrupted workflow.
- Deleting business data cannot reset the three-document free-use counter or an active Pro state.
- Privacy, Terms and Support are directly accessible in-app.
- Runtime document preview now shows issue and due/validity dates in the paper header.
- Business logo fallback branding corrected to OX.

## Independent PDF render verification

The final PDF HTML generator was rendered outside the app using an independent print engine for Classic, Modern and Minimal templates. A 42-line Modern invoice rendered as a 3-page A4 document with repeated table headers and no overlap between line items, totals, notes, payment instructions or footer.
