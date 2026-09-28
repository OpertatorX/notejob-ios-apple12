# NoteJob V1.7 — Employer Resolver

V1.7 sécurise le point le plus important du produit : associer un avis au **bon employeur et au bon SIRET**.

## Parcours

`Entreprise + Ville` → résolution de la commune → résolution du lieu public → candidats SIRENE → classement employeur → établissement précis → statistiques / médias / notation.

## Sources croisées

- Recherche d'Entreprises / SIRENE : identité juridique, SIREN/SIRET, enseignes, NAF, statut actif, caractère employeur, effectifs, coordonnées.
- IGN Géoplateforme : POI public et coordonnées du lieu que l'utilisateur pense rechercher.
- Supabase `employer-search` : réconciliation et classement.

## Affichage

Les résultats montrent :

- enseigne ;
- ville et adresse ;
- activité ;
- exploitant juridique si différent ;
- note NoteJob existante si disponible.

## Média

La résolution média reste liée au SIRET retenu. Le système privilégie les médias manuels, puis le site officiel / page établissement / Wikidata-Wikimedia. Une image trouvée pour un autre SIRET n'est pas utilisée comme image de l'établissement.

## Fichiers importants

- `src/lib/companySearch.ts`
- `src/screens/SearchResultsScreen.tsx`
- `src/screens/CompanyScreen.tsx`
- `supabase/functions/employer-search/index.ts`
- `supabase/functions/business-media/index.ts`
- `preview.html`

## Statut backend

Les Edge Functions `employer-search` et `business-media` sont déployées avec JWT obligatoire.
