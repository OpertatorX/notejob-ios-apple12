# NoteJob V1.8 — Clean UI

- Suppression de toutes les images génériques/fallback dans le parcours principal.
- Suppression des photos automatiques de site/web dans l'UI : seules les données métier restent visibles.
- Accueil simplifié : marque, promesse courte, Entreprise + Ville, Rechercher.
- Résultats simplifiés : nom, adresse, note/nombre d'avis, chevron. Plus de 01/02, NAF, exploitant, hero ville ni miniatures.
- Fiche établissement simplifiée : identité, adresse, note globale, recommandation, 5 dimensions, CTA de notation.
- Les informations techniques SIREN/SIRET/NAF/matching restent dans le moteur, pas dans l'interface.
- Politique média stricte : aucun média automatique n'est affiché par `fetchCompanyMedia`; seuls les médias explicitement validés dans NoteJob restent disponibles pour une future réintroduction contrôlée.
- Moteur `employer-search`, Supabase, avis anonymes, favoris, signalement et AdMob/UMP conservés.
