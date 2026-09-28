# NoteJob V1.5 — Lead Finder Media

- Retrait de Panoramax comme image principale d'entreprise.
- Reprise de la philosophie du moteur de prospection OperatorX : privilégier les informations publiées par le site officiel de l'entreprise et les données structurées ouvertes.
- Nouveau resolver Supabase `business-media` : adresse -> POI OpenStreetMap exact -> site officiel / Wikidata -> OpenGraph / Twitter Card / Schema.org JSON-LD.
- Extraction automatique de l'image principale et du logo depuis le site officiel lorsqu'ils sont exposés publiquement.
- Fallback Wikidata / Wikimedia Commons quand un média libre est lié à l'entité.
- Les photos manuelles NoteJob SIRET/SIREN restent prioritaires sur toutes les sources automatiques.
- Aucune photo de rue générique n'est utilisée comme si elle représentait l'établissement.
- Cache privé `business_web_links` pour le site officiel et l'identifiant Wikidata associés au SIRET.
