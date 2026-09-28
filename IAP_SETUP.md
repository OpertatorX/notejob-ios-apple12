# OX Invoice - IAP production setup

This is the small account-bound part that must be completed before a production build can sell OX Invoice Pro.

## 1. App Store Connect

Create one auto-renewable subscription group:

`OX Invoice Pro`

Create these products exactly:

| Product ID | Duration | Target launch price |
|---|---:|---:|
| `com.operatorx.oxinvoice.pro.6months` | 6 months | 9.99 EUR |
| `com.operatorx.oxinvoice.pro.yearly` | 1 year | 16.99 EUR |

Use Apple's price-point/localization tools for the final storefront prices. Add the required subscription display names/descriptions for English (U.S.) and French.

## 2. IAPKit

Create/connect the OX Invoice project for bundle ID:

`com.operatorx.oxinvoice`

Copy only the **publishable** key beginning with:

`openiap-kit_pk_`

Never put a secret/server key in the app.

## 3. GitHub secret

Add:

`EXPO_PUBLIC_IAPKIT_API_KEY`

with the publishable IAPKit key as its value.

The existing OperatorX Apple signing/App Store Connect secrets are also required by the Factory release workflow.

## 4. Required device check before submission

On a physical iPhone using an App Store Sandbox tester:

1. Open a fresh OX Invoice install.
2. Create/share 3 documents and confirm the fourth opens the Pro paywall.
3. Buy the 6-month Sandbox subscription.
4. Confirm unlimited creation is unlocked only after verification.
5. Delete/reinstall or sign out/in as appropriate, then use Restore Purchases.
6. Confirm Pro is restored.
7. Cancel/revoke/expire the Sandbox entitlement and confirm a later entitlement refresh does not grant Pro indefinitely.

Do not submit the app until this purchase + restore path has passed once on a real device.
