# NoteJob V0.2

## Changement principal

Les évaluations sont désormais liées à un **établissement précis** et non plus seulement à une entreprise.

Parcours :

1. saisir le nom de l’entreprise ;
2. saisir la ville ou le code postal ;
3. sélectionner l’établissement exact grâce à la ville, l’adresse et le SIRET ;
4. consulter ou publier les notes de cet établissement.

Le SIREN reste enregistré au niveau de la société pour permettre ensuite un agrégat France entière.

## Backend

Le schéma Supabase est normalisé :

- `companies` : une ligne par SIREN ;
- `establishments` : une ligne par SIRET ;
- `ratings` : une note par utilisateur anonyme + SIRET.

Les avis individuels restent privés côté client ; seules les statistiques agrégées sont exposées par RPC.
