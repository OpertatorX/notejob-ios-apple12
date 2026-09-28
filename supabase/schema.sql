-- NoteJob V0.5 — production-oriented Supabase schema
-- Model: Company (SIREN) -> Establishment (SIRET / city) -> anonymous structured ratings
--
-- Setup:
-- 1) Create a Supabase project.
-- 2) Authentication > Providers > Anonymous: enable Anonymous Sign-Ins.
-- 3) Run this file in SQL Editor.
-- 4) Put only the Project URL + publishable key in the Expo app.

create extension if not exists pgcrypto;

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  siren text not null unique check (siren ~ '^[0-9]{9}$'),
  legal_name text not null check (char_length(legal_name) between 1 and 180),
  created_at timestamptz not null default now()
);

create table if not exists public.establishments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  siret text not null unique check (siret ~ '^[0-9]{14}$'),
  display_name text not null check (char_length(display_name) between 1 and 180),
  city text not null check (char_length(city) between 1 and 120),
  postal_code text check (postal_code is null or postal_code ~ '^[0-9A-Za-z -]{2,12}$'),
  address text check (address is null or char_length(address) <= 220),
  industry text check (industry is null or char_length(industry) <= 32),
  is_headquarters boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists establishments_company_id_idx on public.establishments(company_id);
create index if not exists establishments_city_idx on public.establishments(lower(city));

create table if not exists public.ratings (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid not null references public.establishments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  management smallint not null check (management between 1 and 5),
  compensation smallint not null check (compensation between 1 and 5),
  culture smallint not null check (culture between 1 and 5),
  balance smallint not null check (balance between 1 and 5),
  career smallint not null check (career between 1 and 5),
  recommend boolean not null,
  employment_status text not null check (employment_status in ('current','former')),
  job_title text check (job_title is null or char_length(job_title) <= 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(establishment_id, user_id)
);

create index if not exists ratings_establishment_idx on public.ratings(establishment_id);
create index if not exists ratings_user_idx on public.ratings(user_id);
create index if not exists ratings_created_idx on public.ratings(created_at desc);

create table if not exists public.establishment_reports (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid not null references public.establishments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reason text not null check (reason in ('wrong_name','wrong_address','closed','duplicate','other')),
  status text not null default 'open' check (status in ('open','reviewed','resolved','dismissed')),
  reviewed_at timestamptz,
  admin_note text check (admin_note is null or char_length(admin_note) <= 500),
  created_at timestamptz not null default now(),
  unique(establishment_id, user_id, reason)
);

create index if not exists establishment_reports_user_idx on public.establishment_reports(user_id);
create index if not exists establishment_reports_status_created_idx on public.establishment_reports(status, created_at desc);

alter table public.companies enable row level security;
alter table public.establishments enable row level security;
alter table public.ratings enable row level security;
alter table public.establishment_reports enable row level security;

-- Tight table privileges: public can read reference data; rating writes go through RPCs.
revoke all on table public.companies from anon, authenticated;
revoke all on table public.establishments from anon, authenticated;
revoke all on table public.ratings from anon, authenticated;
revoke all on table public.establishment_reports from anon, authenticated;

grant select on table public.companies to anon, authenticated;
grant select on table public.establishments to anon, authenticated;
grant select on table public.ratings to authenticated;

-- Public company/establishment reference data.
drop policy if exists "companies public read" on public.companies;
create policy "companies public read" on public.companies
for select to anon, authenticated using (true);

drop policy if exists "establishments public read" on public.establishments;
create policy "establishments public read" on public.establishments
for select to anon, authenticated using (true);

-- A signed-in anonymous user can only read their own individual rating row.
drop policy if exists "ratings own select" on public.ratings;
create policy "ratings own select" on public.ratings
for select to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

-- Reports are intentionally inaccessible via direct table APIs; writes go only through the report RPC.
drop policy if exists "reports no direct access" on public.establishment_reports;
create policy "reports no direct access" on public.establishment_reports
as restrictive for all to anon, authenticated
using (false)
with check (false);

-- Canonical helper used by the app after it has selected a government API result.
create or replace function public.ensure_establishment(
  p_siren text,
  p_siret text,
  p_legal_name text,
  p_display_name text,
  p_city text,
  p_postal_code text default null,
  p_address text default null,
  p_industry text default null,
  p_is_headquarters boolean default false
)
returns table(company_id uuid, establishment_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_id uuid;
  v_establishment_id uuid;
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;
  if p_siren !~ '^[0-9]{9}$' or p_siret !~ '^[0-9]{14}$' then
    raise exception 'INVALID_COMPANY_ID';
  end if;
  if nullif(trim(p_legal_name), '') is null or nullif(trim(p_display_name), '') is null or nullif(trim(p_city), '') is null then
    raise exception 'MISSING_REQUIRED_DATA';
  end if;

  insert into public.companies (siren, legal_name)
  values (p_siren, left(trim(p_legal_name), 180))
  on conflict (siren) do nothing;

  select c.id into v_company_id from public.companies c where c.siren = p_siren;

  insert into public.establishments (
    company_id, siret, display_name, city, postal_code, address, industry, is_headquarters
  ) values (
    v_company_id,
    p_siret,
    left(trim(p_display_name), 180),
    left(trim(p_city), 120),
    nullif(left(trim(coalesce(p_postal_code, '')), 12), ''),
    nullif(left(trim(coalesce(p_address, '')), 220), ''),
    nullif(left(trim(coalesce(p_industry, '')), 32), ''),
    coalesce(p_is_headquarters, false)
  ) on conflict (siret) do nothing;

  select e.id into v_establishment_id from public.establishments e where e.siret = p_siret;
  return query select v_company_id, v_establishment_id;
end;
$$;

-- Upsert only the current user's rating. First-time submissions are rate-limited to 20 / 24h.
create or replace function public.submit_rating(
  p_establishment_id uuid,
  p_management smallint,
  p_compensation smallint,
  p_culture smallint,
  p_balance smallint,
  p_career smallint,
  p_recommend boolean,
  p_employment_status text,
  p_job_title text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_rating_id uuid;
  v_recent_count integer;
begin
  if v_user_id is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_management not between 1 and 5
    or p_compensation not between 1 and 5
    or p_culture not between 1 and 5
    or p_balance not between 1 and 5
    or p_career not between 1 and 5 then
    raise exception 'INVALID_SCORE';
  end if;
  if p_employment_status not in ('current','former') then raise exception 'INVALID_STATUS'; end if;
  if p_job_title is not null and char_length(p_job_title) > 80 then raise exception 'JOB_TITLE_TOO_LONG'; end if;
  if not exists (select 1 from public.establishments where id = p_establishment_id) then raise exception 'UNKNOWN_ESTABLISHMENT'; end if;

  select id into v_rating_id
  from public.ratings
  where establishment_id = p_establishment_id and user_id = v_user_id;

  if v_rating_id is null then
    select count(*) into v_recent_count
    from public.ratings
    where user_id = v_user_id and created_at >= now() - interval '24 hours';

    if v_recent_count >= 20 then raise exception 'RATE_LIMIT'; end if;

    insert into public.ratings (
      establishment_id, user_id, management, compensation, culture, balance, career,
      recommend, employment_status, job_title
    ) values (
      p_establishment_id, v_user_id, p_management, p_compensation, p_culture, p_balance, p_career,
      p_recommend, p_employment_status, nullif(left(trim(coalesce(p_job_title, '')), 80), '')
    ) returning id into v_rating_id;
  else
    update public.ratings set
      management = p_management,
      compensation = p_compensation,
      culture = p_culture,
      balance = p_balance,
      career = p_career,
      recommend = p_recommend,
      employment_status = p_employment_status,
      job_title = nullif(left(trim(coalesce(p_job_title, '')), 80), ''),
      updated_at = now()
    where id = v_rating_id and user_id = v_user_id;
  end if;

  return v_rating_id;
end;
$$;

create or replace function public.delete_my_rating(p_establishment_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deleted integer;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  delete from public.ratings
  where establishment_id = p_establishment_id and user_id = auth.uid();
  get diagnostics v_deleted = row_count;
  return v_deleted > 0;
end;
$$;

create or replace function public.submit_establishment_report(
  p_establishment_id uuid,
  p_reason text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_report_id uuid;
begin
  if v_user_id is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_reason not in ('wrong_name','wrong_address','closed','duplicate','other') then raise exception 'INVALID_REASON'; end if;

  insert into public.establishment_reports(establishment_id, user_id, reason)
  values (p_establishment_id, v_user_id, p_reason)
  on conflict (establishment_id, user_id, reason)
  do update set created_at = now()
  returning id into v_report_id;

  return v_report_id;
end;
$$;

create or replace function public.establishment_stats(p_establishment_id uuid)
returns table (
  rating_count bigint,
  overall numeric,
  management numeric,
  compensation numeric,
  culture numeric,
  balance numeric,
  career numeric,
  recommend_percent numeric,
  star_1 bigint,
  star_2 bigint,
  star_3 bigint,
  star_4 bigint,
  star_5 bigint
)
language sql
security definer
set search_path = public
as $$
  with base as (
    select *, ((management + compensation + culture + balance + career)::numeric / 5.0) as overall_score
    from public.ratings where establishment_id = p_establishment_id
  )
  select
    count(*)::bigint,
    coalesce(round(avg(overall_score), 2), 0),
    coalesce(round(avg(management), 2), 0),
    coalesce(round(avg(compensation), 2), 0),
    coalesce(round(avg(culture), 2), 0),
    coalesce(round(avg(balance), 2), 0),
    coalesce(round(avg(career), 2), 0),
    coalesce(round(100.0 * avg(case when recommend then 1 else 0 end), 1), 0),
    count(*) filter (where round(overall_score) = 1),
    count(*) filter (where round(overall_score) = 2),
    count(*) filter (where round(overall_score) = 3),
    count(*) filter (where round(overall_score) = 4),
    count(*) filter (where round(overall_score) = 5)
  from base;
$$;

create or replace function public.company_stats(p_company_id uuid)
returns table (rating_count bigint, overall numeric, recommend_percent numeric)
language sql
security definer
set search_path = public
as $$
  with base as (
    select r.*, ((r.management + r.compensation + r.culture + r.balance + r.career)::numeric / 5.0) as overall_score
    from public.ratings r
    join public.establishments e on e.id = r.establishment_id
    where e.company_id = p_company_id
  )
  select
    count(*)::bigint,
    coalesce(round(avg(overall_score), 2), 0),
    coalesce(round(100.0 * avg(case when recommend then 1 else 0 end), 1), 0)
  from base;
$$;

revoke all on function public.ensure_establishment(text,text,text,text,text,text,text,text,boolean) from public;
revoke all on function public.submit_rating(uuid,smallint,smallint,smallint,smallint,smallint,boolean,text,text) from public;
revoke all on function public.delete_my_rating(uuid) from public;
revoke all on function public.submit_establishment_report(uuid,text) from public;
revoke all on function public.establishment_stats(uuid) from public;
revoke all on function public.company_stats(uuid) from public;

-- Supabase grants execute on new public functions to anon/authenticated through default privileges.
-- Explicitly remove anon from all write RPCs; only aggregate stat RPCs remain public.
revoke execute on function public.ensure_establishment(text,text,text,text,text,text,text,text,boolean) from anon;
revoke execute on function public.submit_rating(uuid,smallint,smallint,smallint,smallint,smallint,boolean,text,text) from anon;
revoke execute on function public.delete_my_rating(uuid) from anon;
revoke execute on function public.submit_establishment_report(uuid,text) from anon;

grant execute on function public.ensure_establishment(text,text,text,text,text,text,text,text,boolean) to authenticated;
grant execute on function public.submit_rating(uuid,smallint,smallint,smallint,smallint,smallint,boolean,text,text) to authenticated;
grant execute on function public.delete_my_rating(uuid) to authenticated;
grant execute on function public.submit_establishment_report(uuid,text) to authenticated;
grant execute on function public.establishment_stats(uuid) to anon, authenticated;
grant execute on function public.company_stats(uuid) to anon, authenticated;
