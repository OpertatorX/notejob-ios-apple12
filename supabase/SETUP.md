# Supabase — NoteJob V0.4

Le projet Supabase a déjà été créé et le schéma est déjà déployé.

## Projet

- Project ref: `ruyrbxlwueimtkcidbqa`
- Region: `eu-west-3` (Paris)
- L'application utilise uniquement la Project URL et la **Publishable key** côté client.

## Dernière action manuelle requise

Dans Supabase :

**Authentication → Providers → Anonymous Sign-Ins → Enable → Save**

Cette option est nécessaire car NoteJob crée une identité technique anonyme au premier dépôt de note. Aucun e-mail ou profil public n'est demandé.

## Sécurité déployée

- RLS activé sur toutes les tables.
- `companies` / `establishments` : lecture publique uniquement.
- `ratings` : aucune lecture publique des lignes individuelles ; l'utilisateur connecté ne peut lire que sa propre note.
- écritures via RPC contrôlées seulement.
- `establishment_reports` n'est pas lisible depuis le client.
- les statistiques publiques renvoient uniquement des agrégats.
- aucune clé secrète/service-role dans l'application.
