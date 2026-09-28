# NoteJob — modération V0.5

Le backend garde les signalements dans `public.establishment_reports`. Cette table n'a aucune policy de lecture côté client : un utilisateur de l'app ne peut donc jamais lire les signalements des autres.

## États

- `open` : à traiter
- `reviewed` : vérifié, décision en cours
- `resolved` : correction faite
- `dismissed` : signalement non retenu

## Voir les signalements ouverts

À exécuter uniquement dans le SQL Editor Supabase avec un compte projet :

```sql
select
  r.id,
  r.created_at,
  r.reason,
  r.status,
  e.display_name,
  e.city,
  e.postal_code,
  e.address,
  e.siret,
  c.legal_name,
  c.siren
from public.establishment_reports r
join public.establishments e on e.id = r.establishment_id
join public.companies c on c.id = e.company_id
where r.status = 'open'
order by r.created_at asc;
```

## Marquer comme résolu

```sql
update public.establishment_reports
set status = 'resolved', reviewed_at = now(), admin_note = 'Correction vérifiée.'
where id = '<REPORT_ID>';
```

## Important

Ne jamais ajouter de lecture publique ou `authenticated` sur `establishment_reports`. Les signalements contiennent l'identifiant technique de l'utilisateur et restent des données internes de modération.
