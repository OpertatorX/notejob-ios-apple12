> Version de travail : **V2.4 Editorial iOS**

# NoteJob V2.4 — Editorial iOS

Passe de finition visuelle sur l’accueil, les résultats, la fiche entreprise et la notation. Le moteur **France Complete V2.3** reste inchangé.

Voir `README_V2.4.md` et `CHANGELOG_V2.4_EDITORIAL_IOS.md`.

# NoteJob V2.2 — Search Fix

Voir `README_V2.2.md` et `CHANGELOG_V2.2_SEARCH_FIX.md`.

# NoteJob V1.1 — Human Editorial

Application iOS Expo SDK 57 pour rechercher une entreprise + ville, sélectionner l'établissement français précis (SIRET), puis consulter ou publier une évaluation structurée et anonyme.

## V1.1 — DA sélectionnée

La V1.1 implémente la direction **Human Editorial / Warm Premium** sélectionnée :

- accueil photo immersif avec recherche flottante ;
- écran Résultats dédié avec ville + liste réelle d'établissements ;
- fiche établissement photo-first avec score circulaire, recommandation et notes par catégorie ;
- parcours de notation harmonisé ;
- palette crème / vert profond / terre cuite ;
- relief subtil, surfaces papier et typographie éditoriale ;
- aucun exemple d'entreprise ou de ville prérempli.

La référence validée est conservée dans `design/human-editorial-reference.png`.

## Recherche

Le moteur utilise l'API publique Recherche d'Entreprises / Annuaire des Entreprises. La note est liée au **SIRET** précis. Le SIREN est conservé pour le regroupement entreprise.

## Médias dynamiques

Ordre de résolution :

1. image/logo du SIRET ;
2. image/logo du SIREN ;
3. fallback éditorial intégré.

Le Media Manager local se trouve dans `media-manager/`. Voir `MEDIA_MANAGER.md`.

## Supabase

- Anonymous Sign-Ins activé ;
- agrégats publics ;
- une note active par identité anonyme + établissement ;
- modification / suppression de sa propre note ;
- signalements structurés ;
- `company_media` pour les images dynamiques ;
- aucune clé `service_role` / secret dans l'application.

## AdMob

UMP + bannière + interstitiel restent intégrés. Vérifier les IDs production avant build.

## Aperçu

`preview.html` contient une version web mobile autonome du parcours Accueil -> Résultats -> Établissement.

## Build Windows

```powershell
npm install
npx expo-doctor
PowerShell -ExecutionPolicy Bypass -File .\BUILD_WINDOWS.ps1
```

Avant production, suivre `PREBUILD_CHECKLIST.md`.


## V1.4 — photos automatiques gratuites

NoteJob n'utilise plus Google Places Photos. Pour chaque établissement, l'app privilégie une photo manuelle définie dans le Media Manager, puis cherche une photo ouverte liée via OpenStreetMap/Wikidata/Wikimedia Commons. À défaut, elle cherche une vue Panoramax IGN proche de l'adresse. Si aucune source fiable n'est trouvée, l'interface garde le fallback NoteJob au lieu d'afficher une photo d'une autre entreprise. Voir `FREE_PHOTOS_SETUP.md`.

## V1.5 — médias site officiel
La source automatique principale est désormais le site officiel de l'entreprise, résolu via le POI exact OpenStreetMap / Wikidata, puis analysé via OpenGraph / Schema.org. Voir `README_V1.5.md`.

## V1.7 — Employer Resolver
La recherche ne fait plus confiance au seul texte de l'enseigne. NoteJob recoupe désormais SIRENE + caractère employeur + effectif + coordonnées + POI IGN + cohérence d'activité avant de proposer le SIRET à noter. L'exploitant juridique est affiché sous l'enseigne lorsque les deux noms diffèrent. Voir `README_V1.7.md` et `CHANGELOG_V1.7_EMPLOYER_RESOLVER.md`.
