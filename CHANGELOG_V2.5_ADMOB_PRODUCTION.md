# NoteJob V2.5 — AdMob production

- App ID iOS AdMob : `ca-app-pub-9441192520255287~5695966144`
- Bannière iOS : `ca-app-pub-9441192520255287/8591748913`
- Interstitiel iOS : `ca-app-pub-9441192520255287/2437404106`
- UMP conservé via `AdsConsent.gatherConsent()` avant initialisation du SDK.
- Les IDs de test ne sont plus utilisés comme fallback sur iOS.
- Correction de l’affichage de bannière : `adsAllowed()` est désormais évalué réellement.
- Interstitiel conservé après publication réussie d’un avis.
