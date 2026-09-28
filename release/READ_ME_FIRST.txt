NOTEJOB 1.0 — RELEASE AUTOMATIQUE

1) Dans AdMob > Confidentialité et messages, publier le message UMP de NoteJob.
2) Puis, dans PowerShell depuis ce dossier :

PowerShell -ExecutionPolicy Bypass -File .\GO_RELEASE.ps1 -UmpPublished

Le script tente automatiquement :
- déploiement du site Vercel + vérification app-ads.txt,
- création/lien projet EAS,
- npm install,
- audit dossier maître,
- TypeScript,
- Expo Doctor,
- export iOS smoke-test,
- config production,
- build EAS iOS.

Si l'App Store ID est renseigné dans factory.app.json, il upload aussi le dernier build vers App Store Connect/TestFlight.
Il NE clique PAS sur Submit for Review.
App Privacy reste volontairement manuelle conformément au dossier maître.
