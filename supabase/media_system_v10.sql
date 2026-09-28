-- NoteJob V1.0 — dynamic company / establishment media

create schema if not exists private;

create table if not exists private.media_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.company_media (
  id uuid primary key default gen_random_uuid(),
  scope_type text not null check (scope_type in ('company', 'establishment')),
  scope_id text not null,
  siren text not null check (siren ~ '^[0-9]{9}$'),
  siret text null check (siret is null or siret ~ '^[0-9]{14}$'),
  logo_path text null,
  hero_path text null,
  alt_text text null check (alt_text is null or char_length(alt_text) <= 220),
  updated_at timestamptz not null default now(),
  updated_by uuid null references auth.users(id) on delete set null,
  constraint company_media_scope_unique unique (scope_type, scope_id),
  constraint company_media_scope_shape check (
    (scope_type = 'company' and scope_id = siren and siret is null)
    or
    (scope_type = 'establishment' and siret is not null and scope_id = siret and left(siret, 9) = siren)
  )
);

create index if not exists company_media_siren_idx on public.company_media (siren);
create index if not exists company_media_siret_idx on public.company_media (siret) where siret is not null;

alter table public.company_media enable row level security;

drop policy if exists "company media public read" on public.company_media;
create policy "company media public read"
on public.company_media
for select
to anon, authenticated
using (true);

create or replace function private.is_media_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from private.media_admins
    where user_id = (select auth.uid())
  );
$$;

revoke all on function private.is_media_admin() from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.is_media_admin() to authenticated;

drop policy if exists "media admins insert company media" on public.company_media;
create policy "media admins insert company media"
on public.company_media
for insert
to authenticated
with check (private.is_media_admin() and updated_by = (select auth.uid()));

drop policy if exists "media admins update company media" on public.company_media;
create policy "media admins update company media"
on public.company_media
for update
to authenticated
using (private.is_media_admin())
with check (private.is_media_admin() and updated_by = (select auth.uid()));

drop policy if exists "media admins delete company media" on public.company_media;
create policy "media admins delete company media"
on public.company_media
for delete
to authenticated
using (private.is_media_admin());

-- One-time bootstrap: the first permanent (non-anonymous) Supabase user to call
-- this RPC becomes the media admin. Afterwards, only that admin gets true.
create or replace function public.claim_first_media_admin()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_is_anonymous boolean := coalesce((auth.jwt()->>'is_anonymous')::boolean, false);
begin
  if v_uid is null or v_is_anonymous then
    return false;
  end if;

  if exists (select 1 from private.media_admins where user_id = v_uid) then
    return true;
  end if;

  if exists (select 1 from private.media_admins) then
    return false;
  end if;

  insert into private.media_admins(user_id) values (v_uid);
  return true;
end;
$$;

revoke all on function public.claim_first_media_admin() from public, anon;
grant execute on function public.claim_first_media_admin() to authenticated;

-- Public media bucket: downloads are public, writes stay protected by RLS.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'company-media',
  'company-media',
  true,
  8388608,
  array['image/jpeg','image/png','image/webp']::text[]
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "media admins list company media objects" on storage.objects;
create policy "media admins list company media objects"
on storage.objects
for select
to authenticated
using (bucket_id = 'company-media' and private.is_media_admin());

drop policy if exists "media admins upload company media objects" on storage.objects;
create policy "media admins upload company media objects"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'company-media' and private.is_media_admin());

drop policy if exists "media admins update company media objects" on storage.objects;
create policy "media admins update company media objects"
on storage.objects
for update
to authenticated
using (bucket_id = 'company-media' and private.is_media_admin())
with check (bucket_id = 'company-media' and private.is_media_admin());

drop policy if exists "media admins delete company media objects" on storage.objects;
create policy "media admins delete company media objects"
on storage.objects
for delete
to authenticated
using (bucket_id = 'company-media' and private.is_media_admin());

grant select on public.company_media to anon, authenticated;
grant insert, update, delete on public.company_media to authenticated;
