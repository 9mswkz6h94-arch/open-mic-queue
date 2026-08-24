begin;

-- Additive saved-show foundation. The working performers contract remains intact.
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  email text,
  phone_e164 text,
  timezone text not null default 'America/Chicago',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.artist_profiles (
  id uuid primary key default gen_random_uuid(),
  owner_profile_id uuid references public.profiles(id) on delete set null,
  stage_name text not null check (btrim(stage_name) <> ''),
  real_name text,
  bio text,
  performer_notes text,
  social_links jsonb not null default '{}'::jsonb,
  profile_picture_path text,
  moderation_status text not null default 'draft'
    check (moderation_status in ('draft','submitted','approved','legacy_published','rejected','removed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid references public.venues(id) on delete set null,
  title text not null check (btrim(title) <> ''),
  slug text not null unique check (slug = lower(slug)),
  starts_at timestamptz,
  ends_at timestamptz,
  timezone text not null default 'America/Chicago',
  status text not null default 'draft'
    check (status in ('draft','open','running','ended','cancelled','archived')),
  signup_open boolean not null default false,
  allow_reentry boolean not null default true,
  standard_song_limit integer not null default 2 check (standard_song_limit between 1 and 20),
  featured_song_limit integer not null default 7 check (featured_song_limit between 1 and 30),
  event_home_config jsonb not null default '{}'::jsonb,
  display_config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint events_time_order_chk check (ends_at is null or starts_at is null or ends_at >= starts_at)
);

alter table public.performers add column event_id uuid references public.events(id) on delete restrict;
alter table public.performers add column artist_id uuid references public.artist_profiles(id) on delete restrict;
alter table public.performers add column round_number integer not null default 1 check (round_number > 0);
alter table public.performers add column entry_role text not null default 'performer'
  check (entry_role in ('performer','featured_artist'));
alter table public.performers add column entry_status text
  check (entry_status in ('queued','on_deck','performing','performed','withdrawn','no_show'));
alter table public.performers add column locked_at timestamptz;
alter table public.performers add column locked_by uuid references auth.users(id) on delete set null;
alter table public.performers add column legacy_migrated_at timestamptz;

create table public.entry_songs (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.performers(id) on delete cascade,
  position integer not null check (position > 0),
  title text,
  notes text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (entry_id, position),
  check (completed_at is null or started_at is null or completed_at >= started_at)
);

create table public.event_roles (
  event_id uuid not null references public.events(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('host','cohost','featured_artist','media_volunteer')),
  granted_by uuid references public.profiles(id) on delete set null,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  primary key (event_id, profile_id, role)
);

create table public.featured_spotlights (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  artist_id uuid not null references public.artist_profiles(id) on delete cascade,
  entry_id uuid references public.performers(id) on delete set null,
  headline text,
  extended_bio text,
  interview_answers jsonb not null default '{}'::jsonb,
  status text not null default 'draft'
    check (status in ('draft','submitted','approved','published','expired','rejected')),
  approved_by uuid references public.profiles(id) on delete set null,
  approved_at timestamptz,
  published_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, artist_id)
);

create table public.consent_records (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  artist_id uuid references public.artist_profiles(id) on delete set null,
  event_id uuid references public.events(id) on delete set null,
  entry_id uuid references public.performers(id) on delete set null,
  purpose text not null,
  policy_version text not null,
  granted boolean not null,
  source text not null,
  evidence jsonb not null default '{}'::jsonb,
  captured_at timestamptz not null default now(),
  revoked_at timestamptz,
  check (profile_id is not null or artist_id is not null or entry_id is not null)
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  brand text not null,
  topic text not null,
  channel text not null check (channel in ('email','sms')),
  status text not null check (status in ('pending','active','unsubscribed','bounced','complained')),
  policy_version text not null,
  source text not null,
  confirmed_at timestamptz,
  unsubscribed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_id, brand, topic, channel)
);

create table public.production_cues (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  entry_id uuid references public.performers(id) on delete set null,
  song_id uuid references public.entry_songs(id) on delete set null,
  operator_profile_id uuid references public.profiles(id) on delete set null,
  vocabulary_version text not null default '1.0',
  cue_type text not null,
  event_relative_ms bigint check (event_relative_ms is null or event_relative_ms >= 0),
  occurred_at timestamptz not null default now(),
  source text not null default 'host_hud',
  label text,
  metadata jsonb not null default '{}'::jsonb,
  corrects_cue_id uuid references public.production_cues(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.display_prompts (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  prompt_type text not null check (prompt_type in ('announcement','supporter_acknowledgement','safety','operational','custom')),
  region text not null check (region in ('ticker','right_rail','phone_popup')),
  priority integer not null default 0,
  content jsonb not null,
  status text not null default 'draft' check (status in ('draft','previewed','published','expired','cleared')),
  created_by uuid references public.profiles(id) on delete set null,
  published_by uuid references public.profiles(id) on delete set null,
  published_at timestamptz,
  expires_at timestamptz,
  cleared_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.supporter_acknowledgements (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  display_name text not null,
  approved_message text,
  contribution_reference text,
  display_permission boolean not null default false,
  moderation_status text not null default 'draft' check (moderation_status in ('draft','approved','rejected','removed')),
  published_at timestamptz,
  expires_at timestamptz,
  removed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete set null,
  actor_profile_id uuid references public.profiles(id) on delete set null,
  action text not null,
  target_type text not null,
  target_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

do $$
declare t text;
begin
  foreach t in array array['profiles','artist_profiles','events','entry_songs','featured_spotlights','subscriptions','display_prompts','supporter_acknowledgements'] loop
    execute format('create trigger %I before update on public.%I for each row execute function public.set_updated_at()', t || '_set_updated_at', t);
  end loop;
end;
$$;

insert into public.venues (id, name, location)
values ('00000000-0000-4000-8000-000000000001', 'Rainbow Heart Studio Reference Venue', 'Nelson Brew Works')
on conflict (id) do nothing;

insert into public.events (id, venue_id, title, slug, timezone, status, signup_open, allow_reentry)
values (
  '00000000-0000-4000-8000-000000000002',
  '00000000-0000-4000-8000-000000000001',
  'Legacy Open Mic Reference Event',
  'legacy-open-mic-reference-2026-08-23',
  'America/Chicago', 'running', true, true
);

insert into public.artist_profiles (
  id, stage_name, real_name, performer_notes, social_links, profile_picture_path,
  moderation_status, created_at, updated_at
)
select p.id, p.stage_name, nullif(btrim(p.real_name), ''), p.performer_notes,
  coalesce(p.social_links, '{}'::jsonb), p.profile_picture_url, 'legacy_published',
  coalesce(p.created_at at time zone 'America/Chicago', now()),
  coalesce(p.updated_at at time zone 'America/Chicago', now())
from public.performers p;

update public.performers set
  event_id = '00000000-0000-4000-8000-000000000002',
  artist_id = id,
  round_number = 1,
  entry_status = case when attended is true then 'performed' when current is true then 'performing' else 'queued' end,
  legacy_migrated_at = now();

insert into public.entry_songs (entry_id, position, title, created_at, updated_at)
select p.id, n,
  coalesce(
    case
      when nullif(btrim(p.song_titles[n]), '') ~ '^_+$' then null
      else nullif(btrim(p.song_titles[n]), '')
    end,
    case n
      when 1 then case when nullif(btrim(p.song_1_title), '') ~ '^_+$' then null else nullif(btrim(p.song_1_title), '') end
      when 2 then case when nullif(btrim(p.song_2_title), '') ~ '^_+$' then null else nullif(btrim(p.song_2_title), '') end
    end
  ),
  coalesce(p.created_at at time zone 'America/Chicago', now()),
  coalesce(p.updated_at at time zone 'America/Chicago', now())
from public.performers p
cross join lateral generate_series(1, greatest(coalesce(cardinality(p.song_titles), 0), 2)) n;

alter table public.performers add constraint performers_time_order_chk
  check (completed_at is null or started_at is null or completed_at >= started_at) not valid;
alter table public.performers validate constraint performers_time_order_chk;

create unique index performers_one_current_per_event_idx on public.performers (event_id) where current is true;
create unique index performers_event_queue_position_idx on public.performers (event_id, queue_position);
create unique index performers_event_artist_round_idx on public.performers (event_id, artist_id, round_number) where artist_id is not null;
create index performers_event_status_position_idx on public.performers (event_id, entry_status, queue_position);
create index production_cues_event_time_idx on public.production_cues (event_id, occurred_at);
create index display_prompts_event_status_idx on public.display_prompts (event_id, status, priority desc);

alter table public.profiles enable row level security;
alter table public.artist_profiles enable row level security;
alter table public.events enable row level security;
alter table public.entry_songs enable row level security;
alter table public.event_roles enable row level security;
alter table public.featured_spotlights enable row level security;
alter table public.consent_records enable row level security;
alter table public.subscriptions enable row level security;
alter table public.production_cues enable row level security;
alter table public.display_prompts enable row level security;
alter table public.supporter_acknowledgements enable row level security;
alter table public.audit_events enable row level security;

create policy profiles_manage_own on public.profiles for all to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
create policy artists_read_own on public.artist_profiles for select to authenticated
  using (owner_profile_id = auth.uid());
create policy artists_update_own on public.artist_profiles for update to authenticated
  using (owner_profile_id = auth.uid()) with check (owner_profile_id = auth.uid());
create policy entry_songs_read_own on public.entry_songs for select to authenticated
  using (exists (select 1 from public.performers p where p.id = entry_id and p.auth_user_id = auth.uid()));
create policy entry_songs_write_own on public.entry_songs for all to authenticated
  using (exists (select 1 from public.performers p where p.id = entry_id and p.auth_user_id = auth.uid() and p.locked_at is null))
  with check (exists (select 1 from public.performers p where p.id = entry_id and p.auth_user_id = auth.uid() and p.locked_at is null));

-- Allowlists for future cutover; anon grants intentionally wait until access tests pass.
create view public.public_event_home with (security_invoker = true) as
select e.id, e.title, e.slug, e.starts_at, e.ends_at, e.timezone, e.status,
  e.signup_open, v.name venue_name, v.location venue_location
from public.events e left join public.venues v on v.id = e.venue_id
where e.status in ('open','running','ended');

create view public.public_event_queue with (security_invoker = true) as
select p.id entry_id, p.event_id, p.queue_position, p.entry_status, p.entry_role,
  a.stage_name,
  case when a.moderation_status in ('approved','legacy_published') then a.profile_picture_path end profile_picture_path,
  coalesce(jsonb_agg(jsonb_build_object(
    'position', s.position,
    'title', coalesce(nullif(btrim(s.title), ''), 'Song ' || s.position)
  ) order by s.position) filter (where s.id is not null), '[]'::jsonb) songs
from public.performers p
join public.artist_profiles a on a.id = p.artist_id
left join public.entry_songs s on s.entry_id = p.id
where p.entry_status in ('queued','on_deck','performing','performed')
group by p.id, p.event_id, p.queue_position, p.entry_status, p.entry_role,
  a.stage_name, a.profile_picture_path, a.moderation_status;

commit;
