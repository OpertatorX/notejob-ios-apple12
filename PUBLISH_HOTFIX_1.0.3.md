# OX Invoice publish hotfix 1.0.3

Fixes the publication-stage blockers seen on Windows:

- Restores the 7 missing `scripts/ios/*` files from the current `OperatorX-App-Factory-MASTER`.
- Refreshes `release/SOURCE_MANIFEST.json` before the Factory integrity audit, so package-lock and patched release scripts are frozen correctly.
- Fixes PowerShell 5.1 StrictMode environment-variable lookup (`Property Value not found`).
- Separates binary build/upload readiness from final App Store screenshot/site readiness.
- Keeps missing native screenshots and an undeployed legal site from blocking the IPA build; metadata/screenshots are skipped safely until ready.
- Checks required GitHub Actions secret names before consuming a macOS runner.
- Does not open a browser automatically for GitHub auth.

No runtime product/PDF/business logic is changed by this patch.
