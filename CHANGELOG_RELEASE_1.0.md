# NoteJob 1.0 — Release Candidate

- User-facing version reset to 1.0.0 / build 1 for first App Store release.
- Dossier maître release gate added via factory.app.json.
- Latest ResellCalc banner fix capitalized: large anchored adaptive banner, iOS foreground reload, load/failure/impression callbacks, 30-second retry, failed-slot collapse, no clipping.
- Development/preview force Google test ads; production uses NoteJob-specific IDs only.
- UMP remains before Mobile Ads initialization and ads remain non-personalized.
- Production config blocks if UMP, public site/app-ads.txt or EAS project are not confirmed.
- Full Windows release scripts added for site, EAS, preflight and build/upload.
- Validated promo visuals exported to Apple-compatible iPhone 6.9-inch 1320×2868 and iPad 13-inch 2064×2752 folders.
- App Privacy remains manual by design.
