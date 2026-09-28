# NoteJob V1.5 — Lead Finder Media

Cette version remplace les photos de rue Panoramax par une logique inspirée du moteur de prospection OperatorX.

## Résolution média

1. Média manuel NoteJob lié au SIRET.
2. Média manuel lié au SIREN.
3. Géocodage de l'établissement.
4. Recherche du POI exact autour de l'adresse via OpenStreetMap.
5. Récupération éventuelle du site officiel / Wikidata depuis le POI.
6. Lecture du site officiel : OpenGraph, Twitter Card, Schema.org/JSON-LD, favicon/logo.
7. Fallback Wikidata / Wikimedia Commons.
8. Fallback graphique NoteJob si aucune source suffisamment fiable n'est trouvée.

Aucune photo Panoramax n'est utilisée comme hero d'entreprise dans cette version. Google Places n'est pas requis.

## Backend

- Edge Function Supabase : `business-media`
- Table privée : `business_web_links`
- Les liens découverts sont associés au SIRET afin d'éviter de refaire toute la résolution à chaque ouverture.
