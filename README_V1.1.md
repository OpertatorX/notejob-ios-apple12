# NoteJob V1.1 — Human Editorial

Version iOS/Expo de NoteJob construite autour de la direction Human Editorial sélectionnée.

## Parcours principal
1. Accueil : saisir **Entreprise** + **Votre ville**.
2. Résultats : sélectionner le bon établissement réel.
3. Établissement : consulter les notes agrégées par SIRET.
4. Noter : publier anonymement une évaluation structurée.

## Médias dynamiques
Résolution :
1. média du SIRET ;
2. média du SIREN ;
3. image fallback intégrée.

Voir `MEDIA_MANAGER.md` pour gérer les images sans modifier le code.

## Backend
Supabase + authentification anonyme. Les notes publiques restent agrégées.

## Build
Sous Windows : `BUILD_WINDOWS.ps1`.
Avant production, vérifier les IDs AdMob, le projectId EAS et la checklist `PREBUILD_CHECKLIST.md`.
