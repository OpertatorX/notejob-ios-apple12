# OX Invoice - Paid release / IAP production checklist

This checklist is a release blocker for OX Invoice 1.0. Do not submit to App Review until every REQUIRED item is complete.

## Live App Store Connect identifiers

- App Apple ID: `6817043240`
- Subscription group Apple ID: `22423818`
- 6-month subscription Apple ID: `6817230082`
- Annual subscription Apple ID: `6817230898`
- App Store Connect Issuer ID: `635b6c9b-5262-4d54-a022-7f23964370f6`
- App Store Connect metadata: FR + en-US synced
- Subscription prices: configured across 175 territories
- Current subscription blocker: App Review screenshot missing for each subscription
- Final production/TestFlight binary: OX Invoice 1.0 (2)

## Store identity

- Bundle ID: `com.operatorx.oxinvoice`
- EAS project: `@operatorx/ox-invoice`
- Subscription group: `OX Invoice Pro`
- Entitlement: unlimited estimate and invoice creation while an eligible subscription is active.

## App Store Connect products

Create one auto-renewable subscription group:

`OX Invoice Pro`

Create these products exactly, at the same subscription level because they grant the same entitlement at different durations:

| Product ID | Duration | Target launch price |
|---|---:|---:|
| `com.operatorx.oxinvoice.pro.6months` | 6 months | 9.99 EUR |
| `com.operatorx.oxinvoice.pro.yearly` | 1 year | 16.99 EUR |

Use Apple's price-point/localization tools for final storefront prices.

Each subscription requires:
- English (U.S.) display name + description.
- French display name + description.
- Price and availability.
- App Review screenshot showing the in-app paywall/product context.
- Review notes if useful.

Because these are the first auto-renewable subscriptions for OX Invoice, submit the app version, subscription group, and subscriptions together in the same App Review submission.

## Apple business prerequisites — REQUIRED

Before Sandbox or Review:
- Paid Apps Agreement: Active.
- Banking information: complete/approved where required.
- Tax information: complete/approved where required.
- Bundle identifier registered for `com.operatorx.oxinvoice`.

## IAPKit / OpenIAP — REQUIRED

Create/connect the IAPKit project for:

`com.operatorx.oxinvoice`

Use only the publishable key beginning with:

`openiap-kit_pk_`

Never put a secret/admin key in the mobile app.

For Apple verification configure in IAPKit:
- Bundle ID: `com.operatorx.oxinvoice`
- App Apple ID: numeric App Store Connect Apple ID — REQUIRED before production receipts
- Issuer ID
- In-App Purchase Key ID
- Apple In-App Purchase `.p8` private key

The production build must receive `EXPO_PUBLIC_IAPKIT_API_KEY`.

## Purchase security invariants — REQUIRED

OX Invoice must:
1. Fetch real StoreKit subscription products/prices.
2. Start purchase through StoreKit.
3. Verify the Apple JWS with IAPKit before granting Pro.
4. Require `isValid === true`.
5. Require state `entitled`.
6. Require store `apple` on iOS.
7. Require the store-verified `productId` to exactly match one of the two expected OX Invoice products.
8. Grant Pro only after successful verification.
9. Finish the StoreKit transaction only after verification.
10. Restore/sync purchases and then reverify current active entitlements.
11. Refresh entitlement at app launch and when returning to foreground.

These invariants are checked by `scripts/audit-ox-invoice.mjs`.

## Physical iPhone Sandbox / TestFlight test — REQUIRED

Use the final signed build on a physical iPhone.

Fresh install:
1. Launch OX Invoice and confirm an empty account.
2. Create document #1.
3. Create document #2.
4. Create document #3.
5. Confirm attempt #4 opens OX Invoice Pro.
6. Confirm both products load with real App Store localized prices.
7. Confirm Terms, Privacy, and Restore Purchases are visible.

Purchase:
8. Buy the 6-month Sandbox subscription.
9. Confirm Apple purchase sheet succeeds.
10. Confirm Pro unlocks only after verification.
11. Create additional documents to confirm unlimited creation.
12. Kill and reopen the app; confirm Pro remains active after entitlement refresh.

Restore:
13. Reinstall the app or use another eligible device/account state.
14. Tap Restore Purchases.
15. Confirm Pro is restored after StoreKit + IAPKit verification.

Lifecycle:
16. Test cancellation/expiry/revocation in Sandbox where practical.
17. Confirm a later entitlement refresh does not keep Pro active after the verified subscription is no longer entitled.
18. Repeat at least one successful purchase flow with the yearly product or otherwise verify it appears and can open the Apple purchase sheet.

Do not claim production payments are proven until this device test passes.

## Paywall / Review requirements

The paywall must show:
- What Pro unlocks: unlimited document creation.
- The selected subscription duration.
- The localized StoreKit price.
- Auto-renewal disclosure.
- Restore Purchases.
- Terms of Use.
- Privacy Policy.
- A path to manage subscriptions after purchase.

No external purchase/payment link may be used for digital Pro access.

## App Review

Review notes are in:
`apple/review/REVIEW_NOTES.md`

For the first subscription review:
- Select the final corrected build.
- Add the subscription group and both subscriptions to the same draft submission.
- Include subscription Review screenshots.
- Provide App Review contact information.
- Confirm no login is required.
- Make sure App Privacy matches the production IAPKit data flow.

## App Privacy

Current architecture:
- No advertising.
- No ATT.
- No product analytics SDK.
- Business/client/document data stays local unless the user explicitly exports it.
- Purchase proof / transaction and entitlement data is processed by Apple and IAPKit for App Functionality.

Review the final production provider behavior before publishing the App Privacy answers.

## Final release gate

Release is PASS only when all of the following are true:
- Static QA PASS.
- Final signed IPA built after the latest IAP code.
- App Store Connect app exists.
- Both subscriptions exist and are complete.
- Paid Apps Agreement is Active.
- IAPKit Apple configuration is complete.
- Physical-iPhone Sandbox/TestFlight purchase PASS.
- Restore PASS.
- App Privacy complete.
- FR + en-US metadata complete.
- Required screenshots complete.
- App + subscription group + first subscriptions are in the same draft review submission.
