# NoteJob V1.9 — Premium Clean

## Interface
- Nouvelle image hero uniquement sur l’accueil, sans lien avec une entreprise précise.
- Relief iOS renforcé : hero, panneau de recherche flottant, ombres discrètes et surfaces chaudes.
- La fiche entreprise reste volontairement sans fausse image.
- Résumé des notes placé dans une surface légèrement surélevée.

## Vocabulaire
- L’interface utilisateur parle désormais d’« entreprise » plutôt que d’« établissement ».
- Les identifiants SIRET et la logique d’établissement restent internes au moteur et à la base de données.

## Notation
- Le CTA affiche « Noter cette entreprise ».
- Le routage natif vers `RateScreen` est explicite.
- La preview web possède maintenant un vrai parcours de notation fonctionnel : 5 critères, recommandation, situation, poste, publication anonyme vers Supabase.

## Inchangé
- Employer Resolver / recherche entreprise + ville.
- Supabase et sessions anonymes.
- Notes par SIRET en interne.
- Favoris, signalements, réglages, FR/EN, AdMob/UMP.
