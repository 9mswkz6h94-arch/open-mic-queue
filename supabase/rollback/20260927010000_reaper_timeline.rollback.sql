begin;
drop policy if exists events_public_read_open_show on public.events;
drop function if exists public.host_record_timeline_cue(uuid,uuid,text,timestamptz,uuid,uuid,uuid,integer,text,text,text,boolean,text,uuid,jsonb);
drop function if exists public.host_start_recording_session(uuid,uuid,timestamptz,text,text,text,text);
drop function if exists public.append_production_cue_internal(uuid,uuid,text,timestamptz,uuid,uuid,uuid,integer,text,text,text,boolean,text,uuid,jsonb);
drop table if exists public.event_runtime_state;
alter table public.production_cues
  drop column if exists recording_session_id,
  drop column if exists client_cue_id,
  drop column if exists sequence_number,
  drop column if exists client_occurred_at,
  drop column if exists server_received_at,
  drop column if exists recording_relative_ms,
  drop column if exists performer_label_snapshot,
  drop column if exists song_position_snapshot,
  drop column if exists song_label_snapshot,
  drop column if exists note,
  drop column if exists ended_at,
  drop column if exists is_edit_marker,
  drop column if exists publication_status,
  drop column if exists updated_at;
drop table if exists public.recording_sessions;
commit;
