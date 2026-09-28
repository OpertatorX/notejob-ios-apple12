# NoteJob — Media Manager

Le système média est désormais dynamique :

1. média d'établissement (`SIRET`) prioritaire ;
2. sinon média de l'entreprise (`SIREN`) ;
3. sinon fallback visuel intégré à l'app.

Bucket Supabase : `company-media`

Organisation conseillée :

```text
company-media/
  company/<SIREN>/logo.png
  company/<SIREN>/hero.jpg
  establishment/<SIRET>/hero.jpg
```

Table : `public.company_media`

Une ligne entreprise :
- `scope_type = company`
- `scope_id = SIREN`
- `siren = SIREN`
- `siret = null`

Une ligne établissement :
- `scope_type = establishment`
- `scope_id = SIRET`
- `siren = SIREN`
- `siret = SIRET`

Le bucket est public pour la lecture, mais les écritures sont réservées au compte Media Admin.
