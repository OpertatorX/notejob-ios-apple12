# NoteJob V1.0 Media

- Ajout de `public.company_media` dans Supabase.
- Ajout du bucket public `company-media`.
- Résolution automatique des médias : SIRET > SIREN > fallback local.
- La fiche établissement charge désormais dynamiquement le logo et l'image hero.
- Ajout d'un Media Manager web local pour changer logo / hero sans toucher au code.
- Ajout d'un compte Media Admin sécurisé via RLS pour protéger les uploads.
- Taille max : 8 Mo, formats JPEG / PNG / WebP.
