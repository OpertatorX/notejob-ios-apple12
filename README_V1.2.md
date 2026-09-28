# NoteJob V1.2

Cette version corrige deux points bloquants de V1.1 : la recherche entreprise + ville et les photos d'entreprise fictives.

## Recherche
La recherche suit désormais :
1. nom de ville -> API officielle des communes -> code INSEE ;
2. nom d'entreprise + code commune -> API Recherche d'Entreprises ;
3. extraction des établissements actifs de cette commune ;
4. filtrage sur l'enseigne / raison sociale recherchée.

Un code postal peut aussi être saisi directement dans le champ ville.

## Médias
Priorité d'affichage :
1. média SIRET (établissement précis) ;
2. média SIREN (entreprise) ;
3. fallback graphique neutre, jamais une photo prétendant représenter l'entreprise.

Les médias se gèrent avec `media-manager/START_MEDIA_MANAGER.bat`. Le manager possède maintenant sa propre recherche Entreprise + Ville.

## Preview Windows
Ouvrir le dossier de preview local et lancer `OUVRIR_NOTEJOB.bat`.
