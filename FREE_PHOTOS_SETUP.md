# NoteJob V1.4 — photos gratuites

Aucune clé Google Maps n'est nécessaire.

Ordre de priorité des images :
1. photo manuelle NoteJob par SIRET
2. photo manuelle NoteJob par SIREN
3. photo Wikimedia Commons liée à un objet OpenStreetMap/Wikidata proche et correspondant à l'établissement
4. vue Panoramax IGN proche de l'adresse, privilégiant une orientation vers l'établissement quand cette information existe
5. fallback NoteJob neutre

La fonction Supabase `place-photo` réalise le géocodage via le service public Géoplateforme, puis cherche des médias ouverts. Seuls les identifiants de source sont mémorisés dans `open_photo_links` afin d'éviter des recherches répétitives. Les fichiers distants ne sont pas copiés dans Supabase.

Les attributions sont affichées dans l'interface quand une image ouverte est utilisée.
