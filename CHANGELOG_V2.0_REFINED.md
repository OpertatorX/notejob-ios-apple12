# NoteJob V2.0 — Refined iOS UI

## Home
- Retrait du cœur de l’accueil : un seul bouton menu/réglages reste visible.
- Suppression de la ligne décorative `Anonyme · Entreprise + ville · 5 critères`.
- Hero conservé mais renforcé : plus haut, plus profond, meilleure superposition avec la recherche.
- Recherche simplifiée : deux lignes fines Entreprise / Ville dans une seule surface, sans cartes imbriquées.
- Bouton de recherche moins arrondi et plus iOS.
- Recherche automatique après une courte pause quand Entreprise + Ville sont renseignés.
- Les résultats apparaissent directement sous la recherche, sans changement brutal d’écran.
- Un tap sur une entreprise ouvre directement sa fiche.
- Si beaucoup de résultats sont disponibles, `Voir les X entreprises` ouvre la liste complète.

## Navigation
- Les favoris restent disponibles depuis Réglages afin d’alléger le header de l’accueil.
- Le vocabulaire utilisateur reste centré sur `entreprise`. Les identifiants SIRET/établissement restent internes.

## Images
- L’image de l’accueil est uniquement éditoriale.
- Aucune image générique ou automatique n’est présentée comme une photo d’une entreprise.

## Notation
- Le CTA `Noter cette entreprise` reste relié au vrai `RateScreen` natif.
- La preview locale conserve un parcours fonctionnel de notation et d’envoi Supabase.

## Vérifications
- 22 fichiers TS/TSX parsés : 0 erreur de syntaxe.
- JavaScript de la preview : syntaxe valide.
