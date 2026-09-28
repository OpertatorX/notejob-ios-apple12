# NoteJob V0.4

## Backend Supabase réel branché

- Projet Supabase **NoteJob** créé en région Paris (`eu-west-3`).
- URL et clé publishable branchées dans `.env`.
- Schéma de production déployé : `companies`, `establishments`, `ratings`, `establishment_reports`.
- RLS activé sur toutes les tables publiques.
- RPCs déployées pour créer un établissement, publier/modifier/supprimer sa note et signaler une fiche.
- Statistiques établissement et entreprise exposées uniquement sous forme agrégée.
- Permissions RPC resserrées : les écritures exigent une session authentifiée ; les stats restent publiques.
- Recherche Entreprise + Ville / SIRET conservée.

## Action restante côté Supabase

Activer une seule fois **Authentication > Providers > Anonymous Sign-Ins** dans le dashboard Supabase. Le connecteur actuel ne permet pas de modifier ce réglage Auth directement.

## Ensuite

Ajouter les identifiants AdMob production et l'EAS Project ID avant le build App Store.
