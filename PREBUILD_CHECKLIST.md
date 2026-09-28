# NoteJob V0.6 — checklist avant premier build iPhone

## Déjà fait

- [x] Recherche entreprise + ville / code postal
- [x] Identification établissement par SIRET
- [x] Backend Supabase production créé en région Paris
- [x] Notes structurées et agrégées
- [x] Modification / suppression de sa propre note
- [x] Signalement structuré d'une fiche
- [x] Workflow privé de modération
- [x] RLS et permissions RPC resserrées
- [x] FR par défaut + EN
- [x] Pages natives Confidentialité / Conditions / Support
- [x] Site public statique prêt à déployer
- [x] UMP / AdMob préparés dans le code
- [x] app-ads.txt préparé
- [x] Brouillon App Store Connect préparé

## Actions qui nécessitent encore l'accès aux comptes / build

- [x] Supabase > Authentication > Providers > Anonymous Sign-Ins = ON
- [ ] AdMob : créer l'app NoteJob + bannière + interstitiel
- [ ] AdMob : vérifier Privacy & messaging / UMP
- [ ] Remplir les 3 IDs AdMob dans `.env`
- [ ] EAS : `eas init` puis renseigner `EAS_PROJECT_ID`
- [ ] Déployer `site/` sur Vercel et noter les URLs finales
- [ ] Build production iOS
- [ ] Test sur deux appareils / installations
- [ ] Screenshots iPhone + iPad à partir du vrai build
- [ ] App Store Connect + App Privacy finale
- [ ] Soumission Apple

## QA fonctionnelle minimale

1. Rechercher une enseigne + ville.
2. Vérifier que plusieurs établissements ne sont pas mélangés.
3. Publier une note sur appareil A.
4. Ouvrir la même fiche sur appareil B et vérifier la nouvelle moyenne.
5. Modifier la note sur A et vérifier le recalcul sur B.
6. Supprimer la note sur A et vérifier le recalcul sur B.
7. Signaler une fiche et vérifier le rapport dans Supabase.
8. Tester hors connexion / API indisponible.
9. Tester consentement UMP puis bannière/interstitiel.
