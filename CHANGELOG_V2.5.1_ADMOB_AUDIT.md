# NoteJob V2.5.1 — AdMob audit

- Fixed critical banner prop bug: `unitId={bannerUnitId()}` now passes the actual iOS ad unit string.
- Added safe test-ad mode for development and EAS preview builds.
- Production EAS profile explicitly disables test mode and uses the real iOS banner/interstitial IDs.
- Interstitial retries after transient load errors.
- UMP remains before Mobile Ads SDK initialization.
- app-ads.txt remains present in `site/app-ads.txt`; it still must be deployed at the public developer-domain root and verified by AdMob after the App Store listing is live.
