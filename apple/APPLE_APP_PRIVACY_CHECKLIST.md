# Apple App Privacy - OX Invoice 1.0

Manual App Store Connect step. Verify this against the final production binary before submission.

## Tracking
- Data Used to Track You: **No**
- ATT: **No**
- Advertising: **No**

## Data stored only on device (not collected by OperatorX)
The following stays on-device unless the user explicitly shares/exports it and therefore is not treated as collected by the developer for App Privacy purposes:
- Business details and logo
- Client names/contact details
- Estimates, invoices, line items, notes, prices, taxes
- Generated PDFs
- Local JSON backup/export

Photo Library access occurs only when the user selects a business logo. OX Invoice does not upload that photo.

## Purchase verification
OX Invoice uses Apple In-App Purchase and IAPKit/OpenIAP for entitlement verification. A store purchase token / transaction proof is sent for verification.

Recommended App Privacy declaration for the current architecture:
- **Purchases > Purchase History: Collected**
  - Purpose: **App Functionality**
  - Linked to the user: **No**, provided the production IAPKit configuration does not add account identifiers
  - Used for tracking: **No**

Before publishing App Privacy, inspect IAPKit's then-current production privacy/data-processing terms and the actual project configuration. If the verification provider stores device/store identifiers, diagnostics, usage data, or account-linked identifiers beyond purchase history, declare those categories exactly as required. Do not copy an older app's privacy matrix.

## Not collected by the current app
- Contact list
- Precise or approximate location
- Health/Fitness
- Browsing/Search history
- Advertising data
- User ID / account profile (there is no OX Invoice account)
- Diagnostics/analytics by OperatorX (no analytics SDK included)

## Final manual checks
1. Inspect final `package-lock.json` and native binary SDK list.
2. Confirm no analytics/ad SDK was added after this checklist.
3. Confirm IAPKit production data handling.
4. Publish App Privacy in App Store Connect only after these checks.
