# App Review Notes - OX Invoice

## Identity
- App: OX Invoice
- Version/build: 1.0 (2)
- Bundle ID: `com.operatorx.oxinvoice`
- Languages: English (U.S.) + French
- Account/login: None required
- Ads: None
- Tracking: None

## Purpose and complete feature inventory
OX Invoice is a local-first estimate and invoice maker for freelancers, independent contractors, and small businesses.

Main tabs:
1. Home: financial/document summary, recent documents, New Estimate, New Invoice.
2. Clients: searchable saved client list; tapping a client starts a new invoice.
3. Services: reusable line items saved automatically from previous documents.
4. Documents: search/filter estimates and invoices and open their preview.
5. More: OX Invoice Pro status, business/PDF settings, local-data export, Restore Purchases, privacy/terms, local-data deletion.

Document workflow:
- Create/edit estimate or invoice.
- Client details, line items, quantity/rate, discount, tax, deposit, due/valid-until date, and notes.
- Preview document.
- Share/export a PDF using the iOS share sheet.
- Estimates can be marked accepted and converted to invoices.
- Invoices can be marked paid; sent invoices past their due date are shown overdue.
- Documents can be duplicated or deleted.

Business settings:
- Business contact/tax information and payment instructions.
- Optional logo selected by the user from Photos.
- French/English UI selection.
- EUR/USD/GBP/CHF currency.
- Default tax percentage.
- Classic/Modern/Minimal PDF style.

## Permissions
- Photos: requested only if the reviewer taps "Choose logo" in Business settings. The selected image is stored locally and used only inside generated documents. Camera access is disabled.
- No ATT prompt, location permission, contacts access, microphone, or advertising consent flow.

## Network/backend behavior
- Business, client, and document content is stored locally on the device via Expo SQLite key/value storage.
- PDF generation is local using Expo Print; sharing uses the native iOS share sheet.
- No advertising or analytics SDK is included.
- Network access is required only for App Store in-app purchase/subscription operations and server-side purchase verification via IAPKit.

## France e-invoicing scope
OX Invoice generates local PDF estimates/invoices and does not claim to replace regulated French e-invoicing platforms where structured electronic invoicing is legally required. The French Terms and App Store description state this explicitly.

## In-app purchases
OX Invoice is free to download. The first 3 created documents are free. After that, creating another document opens the OX Invoice Pro paywall. While active, Pro provides ongoing unlimited estimate and invoice creation. The subscription entitlement is restored through the App Store on the user's Apple devices, and the app revalidates active entitlement state through IAPKit.

Auto-renewable subscription product IDs:
- `com.operatorx.oxinvoice.pro.6months`
- `com.operatorx.oxinvoice.pro.yearly`

The paywall includes Restore Purchases, Terms, Privacy, renewal disclosure, and the localized App Store price. A purchase is granted only after verification; there is no external payment flow.

## Reviewer walkthrough
1. Launch OX Invoice. A new account starts empty with all dashboard values at zero and no sample documents.
2. Optional: More > Business to add business details, logo, currency, tax rate, language, and PDF template.
3. Home > New Estimate. Enter a client name and one line item, then Save.
4. On Preview, tap Share PDF to generate the A4 document and open the iOS share sheet.
5. Mark the estimate Accepted or tap Convert to invoice.
6. Open Services to reuse a saved line item, or Documents to search/filter saved documents.
7. Create up to 3 documents for free. The fourth creation attempt opens OX Invoice Pro.
8. More > Restore Purchases is available at any time. More also offers local data export and permanent local-data deletion.

## Review guarantees
- No hidden debug, gesture-only, or secret functionality.
- No advertising SDK or test ad IDs in the production app.
- No account credentials are required.
- App Privacy remains a manual App Store Connect step and must match the final production SDK/configuration.
- Final submission is never auto-clicked by the Factory.
