begin;

create table public.recording_sessions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  label text not null default 'Main recording',
  source_kind text not null default 'reaper_multitrack',
  started_at timestamptz not null,
  ended_at timestamptz,
  timezone_snapshot text not null,
  started_by uuid references public.profiles(id) on delete set null,
  filename text,
  device_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ended_at is null or ended_at >= started_at)
);

create table public.event_runtime_state (
  event_id uuid primary key references public.events(id) on delete cascade,
  recording_session_id uuid references public.recording_sessions(id) on delete set null,
  active_entry_id uuid references public.performers(id) on delete set null,
  active_song_id uuid references public.entry_songs(id) on delete set null,
  active_song_position integer,
  open_interval_type text,
  open_interval_cue_id uuid references public.production_cues(id) on delete set null,
  revision bigint not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.production_cues
  add column recording_session_id uuid references public.recording_sessions(id) on delete set null,
  add column client_cue_id uuid,
  add column sequence_number bigint,
  add column client_occurred_at timestamptz,
  add column server_received_at timestamptz not null default now(),
  add column recording_relative_ms bigint check (recording_relative_ms is null or recording_relative_ms >= 0),
  add column performer_label_snapshot text,
  add column song_position_snapshot integer check (song_position_snapshot is null or song_position_snapshot > 0),
  add column song_label_snapshot text,
  add column note text,
  add column ended_at timestamptz,
  add column is_edit_marker boolean not null default false,
  add column publication_status text not null default 'internal'
    check (publication_status in ('internal','approved','do_not_publish')),
  add column updated_at timestamptz not null default now();

update public.production_cues
set client_cue_id = id,
    client_occurred_at = occurred_at,
    sequence_number = numbered.sequence_number
from (
  select id, row_number() over (partition by event_id order by occurred_at, created_at, id) sequence_number
  from public.production_cues
) numbered
where public.production_cues.id = numbered.id;

alter table public.production_cues
  alter column client_cue_id set not null,
  alter column client_occurred_at set not null,
  alter column sequence_number set not null;

create unique index production_cues_client_id_idx on public.production_cues(client_cue_id);
create unique index production_cues_event_sequence_idx on public.production_cues(event_id, sequence_number);
create index recording_sessions_event_started_idx on public.recording_sessions(event_id, started_at);

alter table public.recording_sessions enable row level security;
alter table public.event_runtime_state enable row level security;

create policy recording_sessions_read_event_staff on public.recording_sessions
for select to authenticated using (public.has_active_event_role(event_id, array['host','cohost']));
create policy event_runtime_state_read_event_staff on public.event_runtime_state
for select to authenticated using (public.has_active_event_role(event_id, array['host','cohost']));

create policy events_public_read_open_show on public.events
for select to anon, authenticated using (status in ('open','running','ended'));

grant select on public.events to anon, authenticated;

revoke all on public.recording_sessions from anon;
revoke all on public.event_runtime_state from anon;
grant select on public.recording_sessions to authenticated;
grant select on public.event_runtime_state to authenticated;

create or replace function public.append_production_cue_internal(
  p_event_id uuid,
  p_client_cue_id uuid,
  p_cue_type text,
  p_occurred_at timestamptz,
  p_recording_session_id uuid,
  p_entry_id uuid,
  p_song_id uuid,
  p_song_position integer,
  p_performer_label text,
  p_song_label text,
  p_note text,
  p_is_edit_marker boolean,
  p_publication_status text,
  p_corrects_cue_id uuid,
  p_metadata jsonb
) returns public.production_cues
language plpgsql security definer set search_path = '' as $$
declare
  result public.production_cues;
  next_sequence bigint;
  recording_start timestamptz;
begin
  select * into result from public.production_cues where client_cue_id = p_client_cue_id;
  if found then return result; end if;

  perform 1 from public.events where id = p_event_id for update;
  select coalesce(max(sequence_number), 0) + 1 into next_sequence
  from public.production_cues where event_id = p_event_id;
  select started_at into recording_start from public.recording_sessions
  where id = p_recording_session_id and event_id = p_event_id;

  insert into public.production_cues (
    id, event_id, entry_id, song_id, operator_profile_id, vocabulary_version,
    cue_type, occurred_at, client_occurred_at, source, label, metadata,
    corrects_cue_id, recording_session_id, client_cue_id, sequence_number,
    recording_relative_ms, performer_label_snapshot, song_position_snapshot,
    song_label_snapshot, note, is_edit_marker, publication_status
  ) values (
    p_client_cue_id, p_event_id, p_entry_id, p_song_id, auth.uid(), '2.0',
    p_cue_type, p_occurred_at, p_occurred_at, 'host_hud',
    coalesce(p_song_label, p_performer_label, p_cue_type), coalesce(p_metadata, '{}'::jsonb),
    p_corrects_cue_id, p_recording_session_id, p_client_cue_id, next_sequence,
    case when recording_start is null then null else greatest(0, round(extract(epoch from (p_occurred_at - recording_start)) * 1000)::bigint) end,
    p_performer_label, p_song_position, p_song_label, p_note,
    coalesce(p_is_edit_marker, false), coalesce(p_publication_status, 'internal')
  ) returning * into result;
  return result;
end;
$$;

revoke all on function public.append_production_cue_internal(uuid,uuid,text,timestamptz,uuid,uuid,uuid,integer,text,text,text,boolean,text,uuid,jsonb) from public;

create or replace function public.host_start_recording_session(
  p_event_id uuid,
  p_client_cue_id uuid,
  p_started_at timestamptz,
  p_timezone text,
  p_label text default 'Main recording',
  p_filename text default null,
  p_device_note text default null
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  session_row public.recording_sessions;
  cue_row public.production_cues;
  event_timezone text;
begin
  if not public.has_active_event_role(p_event_id, array['host','cohost']) then
    raise exception 'Host or cohost role required';
  end if;
  select timezone into event_timezone from public.events where id = p_event_id for update;
  if event_timezone is null then raise exception 'Event not found'; end if;
  select pc.* into cue_row from public.production_cues pc where pc.client_cue_id = p_client_cue_id;
  if found then
    select * into session_row from public.recording_sessions where id = cue_row.recording_session_id;
    return jsonb_build_object('recording', to_jsonb(session_row), 'cue', to_jsonb(cue_row));
  end if;
  if exists(select 1 from public.recording_sessions where event_id = p_event_id and ended_at is null) then
    raise exception 'An active recording session already exists for this event';
  end if;

  insert into public.recording_sessions(event_id,label,started_at,timezone_snapshot,started_by,filename,device_note)
  values(p_event_id,coalesce(nullif(btrim(p_label),''),'Main recording'),p_started_at,event_timezone,auth.uid(),p_filename,p_device_note)
  returning * into session_row;

  cue_row := public.append_production_cue_internal(p_event_id,p_client_cue_id,'recording_started',p_started_at,session_row.id,null,null,null,null,null,p_device_note,false,'internal',null,jsonb_build_object('filename',p_filename));
  insert into public.event_runtime_state(event_id,recording_session_id,revision)
  values(p_event_id,session_row.id,1)
  on conflict(event_id) do update set recording_session_id=excluded.recording_session_id,revision=public.event_runtime_state.revision+1,updated_at=now();
  return jsonb_build_object('recording',to_jsonb(session_row),'cue',to_jsonb(cue_row));
end;
$$;

create or replace function public.host_record_timeline_cue(
  p_event_id uuid,
  p_client_cue_id uuid,
  p_cue_type text,
  p_occurred_at timestamptz,
  p_recording_session_id uuid default null,
  p_entry_id uuid default null,
  p_song_id uuid default null,
  p_song_position integer default null,
  p_performer_label text default null,
  p_song_label text default null,
  p_note text default null,
  p_is_edit_marker boolean default false,
  p_publication_status text default 'internal',
  p_corrects_cue_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
) returns public.production_cues
language plpgsql security definer set search_path = '' as $$
declare cue_row public.production_cues;
begin
  if not public.has_active_event_role(p_event_id, array['host','cohost']) then raise exception 'Host or cohost role required'; end if;
  if p_recording_session_id is not null and not exists(select 1 from public.recording_sessions where id = p_recording_session_id and event_id = p_event_id) then
    raise exception 'Recording session does not belong to event';
  end if;
  if p_entry_id is not null and not exists(select 1 from public.performers where id = p_entry_id and event_id = p_event_id) then
    raise exception 'Performer entry does not belong to event';
  end if;
  if p_song_id is not null and not exists(select 1 from public.entry_songs s join public.performers p on p.id = s.entry_id where s.id = p_song_id and p.event_id = p_event_id) then
    raise exception 'Song does not belong to event';
  end if;
  if p_cue_type not in ('recording_stopped','recording_resynced','performer_started','song_started','song_ended','performer_ended','changeover_started','changeover_ended','host_mc_started','host_mc_ended','technical_delay_started','technical_delay_ended','intermission_started','intermission_ended','unplanned_gap_started','unplanned_gap_ended','highlight','audio_issue','do_not_publish_started','do_not_publish_ended','cue_corrected') then
    raise exception 'Unsupported cue type: %', p_cue_type;
  end if;
  cue_row := public.append_production_cue_internal(p_event_id,p_client_cue_id,p_cue_type,p_occurred_at,p_recording_session_id,p_entry_id,p_song_id,p_song_position,p_performer_label,p_song_label,p_note,p_is_edit_marker,p_publication_status,p_corrects_cue_id,p_metadata);
  if p_cue_type = 'recording_stopped' and p_recording_session_id is not null then
    update public.recording_sessions
    set ended_at = greatest(started_at, p_occurred_at), updated_at = now()
    where id = p_recording_session_id and event_id = p_event_id and ended_at is null;
    update public.event_runtime_state
    set recording_session_id = null, revision = revision + 1, updated_at = now()
    where event_id = p_event_id and recording_session_id = p_recording_session_id;
  end if;
  return cue_row;
end;
$$;

revoke all on function public.host_start_recording_session(uuid,uuid,timestamptz,text,text,text,text) from public;
revoke all on function public.host_record_timeline_cue(uuid,uuid,text,timestamptz,uuid,uuid,uuid,integer,text,text,text,boolean,text,uuid,jsonb) from public;
grant execute on function public.host_start_recording_session(uuid,uuid,timestamptz,text,text,text,text) to authenticated;
grant execute on function public.host_record_timeline_cue(uuid,uuid,text,timestamptz,uuid,uuid,uuid,integer,text,text,text,boolean,text,uuid,jsonb) to authenticated;

commit;
