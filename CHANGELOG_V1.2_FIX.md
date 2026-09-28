# NoteJob V1.2 — Search + Media correctness fix

## Recherche entreprise + ville
- La ville n'est plus concaténée naïvement au nom de l'entreprise.
- Résolution de la ville via `geo.api.gouv.fr` pour obtenir le code INSEE de commune.
- Recherche officielle ensuite filtrée par `code_commune` (ou `code_postal` si l'utilisateur saisit directement un code postal).
- Fallback sur la recherche textuelle combinée uniquement si le chemin principal ne retourne rien.
- Filtrage plus strict : les résultats doivent réellement correspondre au nom/enseigne ou à la raison sociale recherchée.
- Meilleure distinction entre enseigne et exploitant juridique.

## Images d'entreprise
- Suppression de toutes les anciennes photos d'exemple utilisées comme fallback sur les résultats et les fiches entreprise.
- Une photo n'est affichée comme photo d'entreprise que si elle existe réellement dans `company_media` pour le SIRET, ou à défaut pour le SIREN.
- Sans média renseigné, l'app affiche un visuel graphique neutre généré à partir de l'entreprise, clairement marqué `PHOTO À AJOUTER` au lieu d'une fausse photo.
- Même règle pour les logos : vrai logo Supabase si présent, sinon monogramme neutre.
- Suppression des anciens assets entreprise/ville d'exemple du bundle runtime.

## Media Manager
- Ajout d'une recherche `Entreprise + Ville` directement dans le Media Manager.
- Un clic sur l'établissement remplit automatiquement SIREN + SIRET.
- Il n'est donc plus nécessaire de rechercher ou saisir manuellement les identifiants avant d'uploader une photo/logo.

## Preview
- Nouveau moteur identique au projet mobile.
- Résultats et fiche chargent les vrais médias Supabase lorsqu'ils existent.
- Aucun média entreprise fictif dans la preview.
