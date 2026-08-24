begin;

-- Future communication containers only. This migration sends nothing and seeds no contact data.
create table public.contact_points (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('email','phone')),
  value text not null check (btrim(value) <> ''),
  normalized_value text not null check (btrim(normalized_value) <> ''),
  status text not null default 'unverified'
    check (status in ('unverified','pending','verified','suppressed','invalid','deleted')),
  is_primary boolean not null default false,
  source text not null,
  verified_at timestamptz,
  suppressed_at timestamptz,
  deleted_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((status = 'verified') = (verified_at is not null) or status in ('suppressed','invalid','deleted')),
  check (kind <> 'phone' or normalized_value ~ '^\+[1-9][0-9]{7,14}$'),
  check (kind <> 'email' or normalized_value = lower(normalized_value))
);

create unique index contact_points_active_value_idx
  on public.contact_points (profile_id, kind, normalized_value)
  where deleted_at is null;
create unique index contact_points_one_primary_idx
  on public.contact_points (profile_id, kind)
  where is_primary is true and deleted_at is null;

comment on table public.contact_points is
  'Restricted contact values. Do not populate phone records until a concrete verified SMS flow exists.';
comment on column public.profiles.phone_e164 is
  'Legacy compatibility only. Future phone capture belongs in contact_points with verification and consent.';

alter table public.subscriptions drop constraint subscriptions_channel_check;
alter table public.subscriptions drop constraint subscriptions_status_check;
alter table public.subscriptions
  add column purpose text not null default 'future_events'
    check (purpose in ('account_service','event_operations','future_events','artist_updates','studio_news','band_news')),
  add column event_id uuid references public.events(id) on delete cascade,
  add column contact_point_id uuid references public.contact_points(id) on delete set null,
  add column consent_record_id uuid references public.consent_records(id) on delete set null,
  add column paused_at timestamptz,
  add column metadata jsonb not null default '{}'::jsonb,
  add constraint subscriptions_channel_check check (channel in ('in_app','push','email','sms')),
  add constraint subscriptions_status_check
    check (status in ('interested','pending','active','paused','unsubscribed','bounced','complained')),
  add constraint subscriptions_activation_evidence_check
    check (status not in ('active','paused') or channel in ('in_app','push') or consent_record_id is not null);

comment on column public.subscriptions.status is
  'interested may record feature interest without a contact point. It is not permission to send.';

create table public.notification_endpoints (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  channel text not null check (channel = 'push'),
  platform text not null check (platform in ('web','ios','android')),
  provider text not null,
  endpoint_secret text not null check (btrim(endpoint_secret) <> ''),
  endpoint_fingerprint text not null check (btrim(endpoint_fingerprint) <> ''),
  permission_state text not null default 'unknown'
    check (permission_state in ('unknown','prompt','granted','denied','revoked')),
  device_label text,
  last_seen_at timestamptz,
  revoked_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, endpoint_fingerprint)
);

create table public.contact_suppressions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade,
  contact_point_id uuid references public.contact_points(id) on delete cascade,
  channel text not null check (channel in ('push','email','sms')),
  scope text not null check (scope in ('topic','brand','channel','global')),
  brand text,
  topic text,
  reason text not null,
  source text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  check (profile_id is not null or contact_point_id is not null),
  check (scope <> 'brand' or brand is not null),
  check (scope <> 'topic' or (brand is not null and topic is not null)),
  check (expires_at is null or expires_at >= created_at)
);

create index contact_suppressions_profile_channel_idx
  on public.contact_suppressions (profile_id, channel, scope);
create index contact_suppressions_contact_channel_idx
  on public.contact_suppressions (contact_point_id, channel, scope);

create table public.notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  contact_point_id uuid references public.contact_points(id) on delete set null,
  endpoint_id uuid references public.notification_endpoints(id) on delete set null,
  channel text not null check (channel in ('in_app','push','email','sms')),
  message_type text not null,
  provider text,
  provider_message_id text,
  idempotency_key text not null unique,
  status text not null default 'draft'
    check (status in ('draft','queued','accepted','delivered','read','failed','suppressed','cancelled')),
  queued_at timestamptz,
  accepted_at timestamptz,
  delivered_at timestamptz,
  read_at timestamptz,
  failed_at timestamptz,
  error_code text,
  error_detail text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index notification_deliveries_profile_created_idx
  on public.notification_deliveries (profile_id, created_at desc);
create index notification_deliveries_status_created_idx
  on public.notification_deliveries (status, created_at);

create trigger contact_points_set_updated_at
  before update on public.contact_points for each row execute function public.set_updated_at();
create trigger notification_endpoints_set_updated_at
  before update on public.notification_endpoints for each row execute function public.set_updated_at();
create trigger notification_deliveries_set_updated_at
  before update on public.notification_deliveries for each row execute function public.set_updated_at();

alter table public.contact_points enable row level security;
alter table public.notification_endpoints enable row level security;
alter table public.contact_suppressions enable row level security;
alter table public.notification_deliveries enable row level security;

-- Supabase public-schema defaults may grant table privileges automatically.
-- These restricted containers expose authenticated self-read only; state changes use future verified RPC/service paths.
revoke all on table public.contact_points from anon, authenticated;
revoke all on table public.notification_endpoints from anon, authenticated;
revoke all on table public.contact_suppressions from anon, authenticated;
revoke all on table public.notification_deliveries from anon, authenticated;
grant select on table public.contact_points to authenticated;
grant select on table public.notification_endpoints to authenticated;
grant select on table public.contact_suppressions to authenticated;
grant select on table public.notification_deliveries to authenticated;

-- Read-only self visibility. Future verified RPCs/service workers own state transitions.
create policy subscriptions_read_own on public.subscriptions for select to authenticated
  using (profile_id = auth.uid());
create policy contact_points_read_own on public.contact_points for select to authenticated
  using (profile_id = auth.uid());
create policy notification_endpoints_read_own on public.notification_endpoints for select to authenticated
  using (profile_id = auth.uid());
create policy contact_suppressions_read_own on public.contact_suppressions for select to authenticated
  using (profile_id = auth.uid());
create policy notification_deliveries_read_own on public.notification_deliveries for select to authenticated
  using (profile_id = auth.uid());

commit;
