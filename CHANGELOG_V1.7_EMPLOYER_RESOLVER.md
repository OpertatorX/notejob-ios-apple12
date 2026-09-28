# NoteJob V1.7 — Employer Resolver

## Pourquoi cette version

Une enseigne publique peut être utilisée par plusieurs sociétés présentes à la même adresse ou dans le même centre commercial. Une recherche textuelle SIRENE seule peut donc remonter un commerce hébergé portant l'enseigne dans ses données, au lieu de l'employeur réellement recherché.

## Nouveau moteur d'identité établissement

La recherche `Entreprise + Ville` passe maintenant d'abord par la Supabase Edge Function `employer-search`.

Le resolver recoupe :

- commune / code postal officiel ;
- POI public IGN Géoplateforme ;
- enseigne et nom commercial SIRENE ;
- nom juridique ;
- SIRET actif ;
- `caractere_employeur` ;
- tranche d'effectif salarié ;
- coordonnées de l'établissement ;
- proximité avec le POI ;
- cohérence entre activité NAF et catégorie du lieu public.

Des alias d'enseignes sont également utilisés pour les grands réseaux lorsque le nom saisi par l'utilisateur diffère de l'enseigne SIRENE, par exemple Super U / Hyper U / U Express.

## Anti-faux-positifs

Le score pénalise maintenant un établissement dont l'activité est incompatible avec le lieu recherché (par exemple restauration rapide face à un hypermarché) lorsque le nom commercial semble seulement reprendre l'enseigne du centre ou du magasin hôte.

Les résultats affichent le nom d'enseigne ET, lorsqu'il diffère, le nom de l'exploitant juridique afin que l'utilisateur sache précisément quel employeur il note.

## Fallback

Si `employer-search` n'est pas joignable, l'app revient sur l'API publique Recherche d'Entreprises avec un classement amélioré basé sur employeur + effectif + état actif.

## Médias

Le média est résolu uniquement APRÈS l'identification du SIRET. `business-media` V3 cherche :

1. média manuel NoteJob ;
2. site officiel via OSM / Wikidata ;
3. domaine de marque via Clearbit Autocomplete si nécessaire ;
4. page locale d'établissement dans les sitemaps du site officiel ;
5. OpenGraph / Twitter Card / Schema.org ;
6. Wikidata / Wikimedia ;
7. fallback NoteJob.

Aucune photo Google Places payante n'est requise.
