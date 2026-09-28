# OX Invoice — App Store screenshot capture plan

Use **real screenshots from the final signed/TestFlight build**, not generated concept art.

## Required sets
Because OX Invoice supports both iPhone and iPad, prepare localized screenshots for both FR and en-US.

Preferred portrait capture/export sizes:
- iPhone 6.9-inch: **1320 × 2868** (also accepted: 1290×2796 or 1260×2736)
- iPad 13-inch: **2064 × 2752** (2048×2732 also accepted)

No alpha/transparency.

## en-US story — 5 screens
1. **Create quotes in minutes** — populated Home + New Estimate CTA.
2. **From estimate to invoice** — editor with client, services, tax and due date.
3. **PDFs clients can trust** — native document preview showing a polished PDF.
4. **Know what is paid** — Documents list with Draft / Sent / Paid / Overdue.
5. **Fair Pro pricing** — paywall with actual localized StoreKit prices loaded.

## fr-FR story — 5 screens
1. **Créez vos devis en quelques minutes**
2. **Du devis à la facture en un geste**
3. **Des PDF propres et professionnels**
4. **Suivez payé, envoyé et en retard**
5. **Pro, sans pub et à prix simple**

## Capture state
Use a dedicated screenshot-only local dataset on the simulator/device. This dataset is never shipped in the production binary. Avoid real personal/customer data.

Recommended fictional business: `Atelier Nord` / `Northline Studio`; client names must be fictional and neutral.

## QA before upload
- Correct language on every screen.
- Actual app logo and final UI.
- Actual prices from StoreKit if the paywall is shown.
- No debug menu, dev client, test-banner, simulator chrome or personal notifications.
- No claims of French e-invoicing compliance.
