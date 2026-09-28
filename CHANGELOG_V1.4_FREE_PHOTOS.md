# V1.4 — Free Photos

- Suppression de la dépendance Google Places Photos et de la clé Google Maps.
- Pipeline automatique gratuit : média manuel -> Wikimedia Commons/OSM/Wikidata -> Panoramax IGN -> fallback.
- Nouvelle table privée `open_photo_links` pour mémoriser uniquement la source et l'identifiant distant par SIRET.
- Fonction Edge `place-photo` remplacée par la version open-data.
- Attribution de source affichée sur les photos.
- Media Manager conservé en priorité absolue pour corriger une photo incorrecte.
