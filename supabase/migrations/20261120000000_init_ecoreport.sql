-- EcoReport: schema, triggers, Row Level Security, RPC functions, storage.
-- Run once on a fresh Supabase project (SQL Editor, or `supabase db push`).
--
-- Access model (explain this in the viva):
--   * anon (public visitor): can NOT read or write any table directly. They only
--     talk to the database through 3 RPC functions below:
--       submit_complaint             -> create a complaint, get a tracking ID back
--       get_complaint_by_tracking_id -> read ONE complaint (needs the exact ID)
--       get_public_complaints        -> anonymised rows for the public dashboard
--   * admin: a logged-in user whose JWT app_metadata has role = 'admin'.
--     Only admins can SELECT all rows, UPDATE complaints, INSERT interventions.

-- ---------------------------------------------------------------------------
-- 1. Enums
-- ---------------------------------------------------------------------------
create type public.complaint_type_enum as enum (
  'air_pollution', 'water_pollution', 'illegal_dumping',
  'noise', 'deforestation', 'other'
);

create type public.complaint_status_enum as enum (
  'submitted', 'under_review', 'action_taken', 'resolved', 'rejected'
);

-- ---------------------------------------------------------------------------
-- 2. Tables
-- ---------------------------------------------------------------------------
-- Counter used to build tracking IDs like ECO-2026-0001.
-- shortcut: one global counter (does not restart each year), fine for a prototype.
create sequence public.complaint_seq;

create table public.complaints (
  id               uuid primary key default gen_random_uuid(),
  tracking_id      text not null unique,             -- filled by trigger below
  complaint_type   public.complaint_type_enum not null,
  description      text not null check (char_length(description) between 10 and 2000),
  location_text    text not null check (char_length(location_text) between 3 and 300),
  latitude         double precision check (latitude  between -90  and 90),
  longitude        double precision check (longitude between -180 and 180),
  complaint_date   date not null default current_date,
  status           public.complaint_status_enum not null default 'submitted',
  reporter_name    text not null check (char_length(reporter_name) between 2 and 100),
  reporter_contact text not null check (char_length(reporter_contact) between 3 and 100),
  photo_url        text check (photo_url is null or (photo_url ~ '^https?://' and char_length(photo_url) <= 500)),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  -- a map pin needs both coordinates, or neither
  constraint lat_lng_together check ((latitude is null) = (longitude is null))
);

create table public.interventions (
  id                uuid primary key default gen_random_uuid(),
  complaint_id      uuid not null references public.complaints(id) on delete cascade,
  action_taken      text not null check (char_length(action_taken) between 3 and 1000),
  department        text not null check (char_length(department) between 2 and 200),
  intervention_date date not null default current_date,
  remarks           text,
  created_at        timestamptz not null default now()
);

create table public.status_history (
  id           uuid primary key default gen_random_uuid(),
  complaint_id uuid not null references public.complaints(id) on delete cascade,
  old_status   public.complaint_status_enum,          -- null for the very first entry
  new_status   public.complaint_status_enum not null,
  changed_at   timestamptz not null default now()
);

create index complaints_status_idx        on public.complaints (status);
create index complaints_date_idx          on public.complaints (complaint_date);
create index interventions_complaint_idx  on public.interventions (complaint_id);
create index status_history_complaint_idx on public.status_history (complaint_id);

-- ---------------------------------------------------------------------------
-- 3. Triggers
-- ---------------------------------------------------------------------------
-- 3a. Build the human-friendly tracking ID before a new row is stored.
create function public.set_tracking_id() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.tracking_id is null or new.tracking_id = '' then
    new.tracking_id := 'ECO-' || to_char(now(), 'YYYY') || '-'
                       || lpad(nextval('public.complaint_seq')::text, 4, '0');
  end if;
  return new;
end $$;

create trigger complaints_set_tracking_id
  before insert on public.complaints
  for each row execute function public.set_tracking_id();

-- 3b. Keep updated_at fresh on every update.
create function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger complaints_touch_updated_at
  before update on public.complaints
  for each row execute function public.touch_updated_at();

-- 3c. Write a status_history row on insert (first status) and whenever status changes.
-- SECURITY DEFINER: the admin who changes the status has no INSERT permission on
-- status_history, so the trigger itself must write it. It is not callable by users.
create function public.log_status_change() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    insert into public.status_history (complaint_id, old_status, new_status)
    values (new.id, null, new.status);
  elsif new.status is distinct from old.status then
    insert into public.status_history (complaint_id, old_status, new_status)
    values (new.id, old.status, new.status);
  end if;
  return new;
end $$;

create trigger complaints_log_status_change
  after insert or update of status on public.complaints
  for each row execute function public.log_status_change();

revoke execute on function public.log_status_change() from public, anon, authenticated;
revoke execute on function public.set_tracking_id()   from public, anon, authenticated;
revoke execute on function public.touch_updated_at()  from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4. Row Level Security
-- ---------------------------------------------------------------------------
-- Admin = signed-in user with app_metadata.role = 'admin'. app_metadata can only be
-- changed server-side (never by the user), unlike user_metadata, so it is safe to trust.
create function public.is_admin() returns boolean
language sql stable as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
$$;

alter table public.complaints     enable row level security;
alter table public.interventions  enable row level security;
alter table public.status_history enable row level security;

-- No policy for anon on any table => anon cannot touch the tables directly.
create policy "admin reads complaints" on public.complaints
  for select to authenticated using (public.is_admin());
create policy "admin updates complaints" on public.complaints
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "admin reads interventions" on public.interventions
  for select to authenticated using (public.is_admin());
create policy "admin inserts interventions" on public.interventions
  for insert to authenticated with check (public.is_admin());

create policy "admin reads status history" on public.status_history
  for select to authenticated using (public.is_admin());

-- Explicit table privileges (RLS above still decides which rows).
revoke all on public.complaints, public.interventions, public.status_history from anon;
grant select, update on public.complaints      to authenticated;
grant select, insert on public.interventions   to authenticated;
grant select         on public.status_history  to authenticated;

-- ---------------------------------------------------------------------------
-- 5. Public RPC functions (SECURITY DEFINER = run with owner rights, bypass RLS)
--    They are the ONLY door for anon, and each returns just what is safe to show.
--    Reporter name/contact are never returned.
-- ---------------------------------------------------------------------------

-- 5a. Create a complaint. Status/tracking_id can't be chosen by the caller.
-- (A plain anon INSERT can't return the new tracking ID, because INSERT ... RETURNING
--  needs SELECT permission, which anon deliberately does not have.)
create function public.submit_complaint(
  p_type             public.complaint_type_enum,
  p_description      text,
  p_location_text    text,
  p_latitude         double precision,
  p_longitude        double precision,
  p_date             date,
  p_photo_url        text,
  p_reporter_name    text,
  p_reporter_contact text
) returns text
language plpgsql security definer set search_path = '' as $$
declare
  v_tracking_id text;
begin
  -- +1 day tolerance so a reporter ahead of UTC (e.g. India) is not rejected.
  if p_date is not null and p_date > current_date + 1 then
    raise exception 'Complaint date cannot be in the future' using errcode = '22023';
  end if;

  -- Table CHECK constraints validate lengths, coordinates and photo URL.
  insert into public.complaints (
    complaint_type, description, location_text, latitude, longitude,
    complaint_date, photo_url, reporter_name, reporter_contact
  ) values (
    p_type, trim(p_description), trim(p_location_text), p_latitude, p_longitude,
    coalesce(p_date, current_date), nullif(trim(p_photo_url), ''),
    trim(p_reporter_name), trim(p_reporter_contact)
  ) returning tracking_id into v_tracking_id;

  return v_tracking_id;
end $$;

-- 5b. Track ONE complaint by its exact tracking ID. Returns NULL if not found.
create function public.get_complaint_by_tracking_id(p_tracking_id text)
returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'complaint', jsonb_build_object(
      'tracking_id',    c.tracking_id,
      'complaint_type', c.complaint_type,
      'description',    c.description,
      'location_text',  c.location_text,
      'latitude',       c.latitude,
      'longitude',      c.longitude,
      'complaint_date', c.complaint_date,
      'status',         c.status,
      'photo_url',      c.photo_url,
      'created_at',     c.created_at,
      'updated_at',     c.updated_at
    ),
    'interventions', coalesce((
      select jsonb_agg(jsonb_build_object(
        'action_taken',      i.action_taken,
        'department',        i.department,
        'intervention_date', i.intervention_date,
        'remarks',           i.remarks
      ) order by i.intervention_date, i.created_at)
      from public.interventions i where i.complaint_id = c.id
    ), '[]'::jsonb),
    'history', coalesce((
      select jsonb_agg(jsonb_build_object(
        'old_status', h.old_status,
        'new_status', h.new_status,
        'changed_at', h.changed_at
      ) order by h.changed_at)
      from public.status_history h where h.complaint_id = c.id
    ), '[]'::jsonb)
  )
  from public.complaints c
  where c.tracking_id = upper(trim(p_tracking_id));
$$;

-- 5c. Anonymised rows for the landing-page counters and the public dashboard.
-- shortcut: capped at 5000 rows and aggregated in the app, fine at prototype
-- scale; move the aggregation into SQL if the table grows large.
create function public.get_public_complaints()
returns table (
  tracking_id    text,
  complaint_type public.complaint_type_enum,
  location_text  text,
  latitude       double precision,
  longitude      double precision,
  complaint_date date,
  status         public.complaint_status_enum,
  created_at     timestamptz,
  resolved_at    timestamptz
)
language sql stable security definer set search_path = '' as $$
  select c.tracking_id, c.complaint_type, c.location_text, c.latitude, c.longitude,
         c.complaint_date, c.status, c.created_at,
         case when c.status = 'resolved' then
           (select max(h.changed_at) from public.status_history h
             where h.complaint_id = c.id and h.new_status = 'resolved')
         end
  from public.complaints c
  order by c.created_at desc
  limit 5000;
$$;

revoke execute on function public.submit_complaint(public.complaint_type_enum, text, text, double precision, double precision, date, text, text, text) from public;
revoke execute on function public.get_complaint_by_tracking_id(text) from public;
revoke execute on function public.get_public_complaints() from public;
grant execute on function public.submit_complaint(public.complaint_type_enum, text, text, double precision, double precision, date, text, text, text) to anon, authenticated;
grant execute on function public.get_complaint_by_tracking_id(text) to anon, authenticated;
grant execute on function public.get_public_complaints() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 6. Storage: public bucket for complaint photos
--    Bucket settings enforce "images only, max 5 MB" for every upload.
--    SVG is excluded on purpose (it can carry scripts).
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('complaint-photos', 'complaint-photos', true, 5242880,
        array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Public READ needs no policy (public bucket URLs work without one, and anon
-- still cannot list files). Anyone may UPLOAD into this bucket only.
create policy "anyone uploads complaint photos" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'complaint-photos');
