begin;

create or replace function public.host_apply_show_transition(
  p_event_id uuid,
  p_transition text,
  p_occurred_at timestamptz,
  p_recording_session_id uuid,
  p_entry_id uuid default null,
  p_next_entry_id uuid default null,
  p_song_id uuid default null,
  p_song_position integer default null,
  p_song_label text default null,
  p_interval_type text default null,
  p_note text default null,
  p_cue_ids jsonb default '{}'::jsonb
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  runtime public.event_runtime_state;
  current_entry public.performers;
  target_entry public.performers;
  next_entry public.performers;
  cue public.production_cues;
  cues jsonb := '[]'::jsonb;
  cue_id uuid;
  ended_type text;
begin
  if not public.has_active_event_role(p_event_id, array['host','cohost']) then
    raise exception 'Host or cohost role required';
  end if;

  perform 1 from public.events where id = p_event_id for update;
  if not found then raise exception 'Event not found'; end if;

  if p_recording_session_id is not null and not exists (
    select 1 from public.recording_sessions
    where id = p_recording_session_id and event_id = p_event_id and ended_at is null
  ) then
    raise exception 'Active recording session does not belong to event';
  end if;

  insert into public.event_runtime_state(event_id, recording_session_id, active_entry_id)
  values (
    p_event_id,
    p_recording_session_id,
    (select id from public.performers where event_id = p_event_id and current = true limit 1)
  ) on conflict(event_id) do nothing;

  select * into runtime
  from public.event_runtime_state where event_id = p_event_id for update;

  if p_entry_id is not null then
    select * into target_entry
    from public.performers where id = p_entry_id and event_id = p_event_id for update;
    if not found then raise exception 'Performer entry does not belong to event'; end if;
  end if;

  if p_next_entry_id is not null then
    select * into next_entry
    from public.performers where id = p_next_entry_id and event_id = p_event_id for update;
    if not found then raise exception 'Next performer entry does not belong to event'; end if;
  end if;

  if p_song_id is not null and not exists (
    select 1
    from public.entry_songs song
    join public.performers performer on performer.id = song.entry_id
    where song.id = p_song_id and performer.event_id = p_event_id
  ) then
    raise exception 'Song does not belong to event';
  end if;

  if runtime.active_entry_id is not null then
    select * into current_entry
    from public.performers where id = runtime.active_entry_id and event_id = p_event_id for update;
  end if;
  if current_entry.id is null then
    select * into current_entry
    from public.performers where event_id = p_event_id and current = true limit 1 for update;
  end if;

  if p_transition in ('performer_start','performer_advance','song_start')
     and runtime.open_interval_type is not null then
    cue_id := nullif(p_cue_ids->>'gap_ended','')::uuid;
    if cue_id is null then raise exception 'gap_ended cue id required'; end if;
    ended_type := runtime.open_interval_type || '_ended';
    cue := public.append_production_cue_internal(
      p_event_id, cue_id, ended_type, p_occurred_at, p_recording_session_id,
      null, null, null, null, null, p_note, true, 'internal', null, '{}'::jsonb
    );
    cues := cues || jsonb_build_array(to_jsonb(cue));
    runtime.open_interval_type := null;
    runtime.open_interval_cue_id := null;
  end if;

  if p_transition = 'performer_start' then
    if target_entry.id is null then raise exception 'Performer entry required'; end if;

    if runtime.active_song_position is not null then
      cue_id := nullif(p_cue_ids->>'song_ended','')::uuid;
      if cue_id is null then raise exception 'song_ended cue id required'; end if;
      cue := public.append_production_cue_internal(
        p_event_id, cue_id, 'song_ended', p_occurred_at, p_recording_session_id,
        runtime.active_entry_id, runtime.active_song_id, runtime.active_song_position,
        current_entry.stage_name, null, p_note, false, 'internal', null, '{}'::jsonb
      );
      cues := cues || jsonb_build_array(to_jsonb(cue));
    end if;

    if current_entry.id is not null and current_entry.id <> target_entry.id then
      cue_id := nullif(p_cue_ids->>'performer_ended','')::uuid;
      if cue_id is null then raise exception 'performer_ended cue id required'; end if;
      update public.performers
      set current = false, attended = true, entry_status = 'performed', completed_at = p_occurred_at
      where id = current_entry.id;
      cue := public.append_production_cue_internal(
        p_event_id, cue_id, 'performer_ended', p_occurred_at, p_recording_session_id,
        current_entry.id, null, null, current_entry.stage_name, null, p_note,
        false, 'internal', null, '{}'::jsonb
      );
      cues := cues || jsonb_build_array(to_jsonb(cue));
    end if;

    if current_entry.id is distinct from target_entry.id or target_entry.current is not true then
      cue_id := nullif(p_cue_ids->>'performer_started','')::uuid;
      if cue_id is null then raise exception 'performer_started cue id required'; end if;
      update public.performers
      set current = false
      where event_id = p_event_id and current = true and id <> target_entry.id;
      update public.performers
      set current = true, attended = false, entry_status = 'performing',
          started_at = p_occurred_at, completed_at = null
      where id = target_entry.id;
      cue := public.append_production_cue_internal(
        p_event_id, cue_id, 'performer_started', p_occurred_at, p_recording_session_id,
        target_entry.id, null, null, target_entry.stage_name, null, p_note,
        false, 'internal', null, '{}'::jsonb
      );
      cues := cues || jsonb_build_array(to_jsonb(cue));
    end if;

    update public.event_runtime_state
    set active_entry_id = target_entry.id,
        active_song_id = null,
        active_song_position = null,
        open_interval_type = null,
        open_interval_cue_id = null,
        revision = revision + 1,
        updated_at = now()
    where event_id = p_event_id;

  elsif p_transition = 'performer_advance' then
    if target_entry.id is null then raise exception 'Performer entry required'; end if;
    if runtime.active_entry_id is distinct from target_entry.id then
      raise exception 'Performer is not active for event';
    end if;

    if runtime.active_song_position is not null then
      cue_id := nullif(p_cue_ids->>'song_ended','')::uuid;
      if cue_id is null then raise exception 'song_ended cue id required'; end if;
      cue := public.append_production_cue_internal(
        p_event_id, cue_id, 'song_ended', p_occurred_at, p_recording_session_id,
        target_entry.id, runtime.active_song_id, runtime.active_song_position,
        target_entry.stage_name, null, p_note, false, 'internal', null, '{}'::jsonb
      );
      cues := cues || jsonb_build_array(to_jsonb(cue));
    end if;

    cue_id := nullif(p_cue_ids->>'performer_ended','')::uuid;
    if cue_id is null then raise exception 'performer_ended cue id required'; end if;
    update public.performers
    set current = false, attended = true, entry_status = 'performed', completed_at = p_occurred_at
    where id = target_entry.id;
    cue := public.append_production_cue_internal(
      p_event_id, cue_id, 'performer_ended', p_occurred_at, p_recording_session_id,
      target_entry.id, null, null, target_entry.stage_name, null, p_note,
      false, 'internal', null, '{}'::jsonb
    );
    cues := cues || jsonb_build_array(to_jsonb(cue));

    if next_entry.id is not null then
      cue_id := nullif(p_cue_ids->>'performer_started','')::uuid;
      if cue_id is null then raise exception 'performer_started cue id required'; end if;
      update public.performers
      set current = true, attended = false, entry_status = 'performing',
          started_at = p_occurred_at, completed_at = null
      where id = next_entry.id;
      cue := public.append_production_cue_internal(
        p_event_id, cue_id, 'performer_started', p_occurred_at, p_recording_session_id,
        next_entry.id, null, null, next_entry.stage_name, null, p_note,
        false, 'internal', null, '{}'::jsonb
      );
      cues := cues || jsonb_build_array(to_jsonb(cue));
    end if;

    update public.event_runtime_state
    set active_entry_id = next_entry.id,
        active_song_id = null,
        active_song_position = null,
        open_interval_type = null,
        open_interval_cue_id = null,
        revision = revision + 1,
        updated_at = now()
    where event_id = p_event_id;

  elsif p_transition = 'song_start' then
    if target_entry.id is null then raise exception 'Performer entry required'; end if;
    if runtime.active_entry_id is distinct from target_entry.id then
      raise exception 'Performer is not active for event';
    end if;

    if runtime.active_song_position = p_song_position
       and runtime.active_song_id is not distinct from p_song_id then
      return jsonb_build_object('cues', cues);
    end if;

    if runtime.active_song_position is not null then
      cue_id := nullif(p_cue_ids->>'song_ended','')::uuid;
      if cue_id is null then raise exception 'song_ended cue id required'; end if;
      cue := public.append_production_cue_internal(
        p_event_id, cue_id, 'song_ended', p_occurred_at, p_recording_session_id,
        target_entry.id, runtime.active_song_id, runtime.active_song_position,
        target_entry.stage_name, null, p_note, false, 'internal', null, '{}'::jsonb
      );
      cues := cues || jsonb_build_array(to_jsonb(cue));
    end if;

    cue_id := nullif(p_cue_ids->>'song_started','')::uuid;
    if cue_id is null then raise exception 'song_started cue id required'; end if;
    cue := public.append_production_cue_internal(
      p_event_id, cue_id, 'song_started', p_occurred_at, p_recording_session_id,
      target_entry.id, p_song_id, p_song_position, target_entry.stage_name,
      p_song_label, p_note, false, 'internal', null, '{}'::jsonb
    );
    cues := cues || jsonb_build_array(to_jsonb(cue));

    update public.event_runtime_state
    set active_song_id = p_song_id,
        active_song_position = p_song_position,
        open_interval_type = null,
        open_interval_cue_id = null,
        revision = revision + 1,
        updated_at = now()
    where event_id = p_event_id;

  elsif p_transition = 'song_end' then
    if runtime.active_song_position is not null then
      cue_id := nullif(p_cue_ids->>'song_ended','')::uuid;
      if cue_id is null then raise exception 'song_ended cue id required'; end if;
      cue := public.append_production_cue_internal(
        p_event_id, cue_id, 'song_ended', p_occurred_at, p_recording_session_id,
        runtime.active_entry_id, runtime.active_song_id, runtime.active_song_position,
        current_entry.stage_name, null, p_note, false, 'internal', null, '{}'::jsonb
      );
      cues := cues || jsonb_build_array(to_jsonb(cue));
    end if;
    update public.event_runtime_state
    set active_song_id = null, active_song_position = null,
        revision = revision + 1, updated_at = now()
    where event_id = p_event_id;

  elsif p_transition = 'gap_set' then
    if p_interval_type is not null and p_interval_type not in (
      'changeover','host_mc','technical_delay','intermission','unplanned_gap'
    ) then
      raise exception 'Unsupported interval type';
    end if;

    if runtime.open_interval_type is not null then
      ended_type := runtime.open_interval_type || '_ended';
      cue_id := nullif(p_cue_ids->>'gap_ended','')::uuid;
      if cue_id is null then raise exception 'gap_ended cue id required'; end if;
      cue := public.append_production_cue_internal(
        p_event_id, cue_id, ended_type, p_occurred_at, p_recording_session_id,
        null, null, null, null, null, p_note, true, 'internal', null, '{}'::jsonb
      );
      cues := cues || jsonb_build_array(to_jsonb(cue));
    end if;

    if p_interval_type is not null and p_interval_type is distinct from runtime.open_interval_type then
      cue_id := nullif(p_cue_ids->>'gap_started','')::uuid;
      if cue_id is null then raise exception 'gap_started cue id required'; end if;
      cue := public.append_production_cue_internal(
        p_event_id, cue_id, p_interval_type || '_started', p_occurred_at,
        p_recording_session_id, null, null, null, null, null, p_note,
        true, 'internal', null, '{}'::jsonb
      );
      cues := cues || jsonb_build_array(to_jsonb(cue));
      update public.event_runtime_state
      set open_interval_type = p_interval_type,
          open_interval_cue_id = cue.id,
          revision = revision + 1,
          updated_at = now()
      where event_id = p_event_id;
    else
      update public.event_runtime_state
      set open_interval_type = null,
          open_interval_cue_id = null,
          revision = revision + 1,
          updated_at = now()
      where event_id = p_event_id;
    end if;
  else
    raise exception 'Unsupported transition: %', p_transition;
  end if;

  return jsonb_build_object('cues', cues);
end;
$$;

create or replace function public.host_undo_show_transition(
  p_event_id uuid,
  p_occurred_at timestamptz,
  p_corrections jsonb,
  p_snapshots jsonb,
  p_note text default null
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  snapshot jsonb;
  correction jsonb;
  corrected public.production_cues;
  restored public.production_cues;
  cues jsonb := '[]'::jsonb;
begin
  if not public.has_active_event_role(p_event_id, array['host','cohost']) then
    raise exception 'Host or cohost role required';
  end if;
  perform 1 from public.events where id = p_event_id for update;
  if not found then raise exception 'Event not found'; end if;

  for snapshot in select value from jsonb_array_elements(coalesce(p_snapshots, '[]'::jsonb)) loop
    if not exists (
      select 1 from public.performers
      where id = (snapshot->>'id')::uuid and event_id = p_event_id for update
    ) then
      raise exception 'Undo entry does not belong to event';
    end if;
    update public.performers
    set current = (snapshot->>'current')::boolean,
        attended = (snapshot->>'attended')::boolean,
        queue_position = (snapshot->>'queue_position')::integer,
        started_at = nullif(snapshot->>'started_at','')::timestamptz,
        completed_at = nullif(snapshot->>'completed_at','')::timestamptz,
        entry_status = case
          when (snapshot->>'attended')::boolean then 'performed'
          when (snapshot->>'current')::boolean then 'performing'
          else 'queued'
        end
    where id = (snapshot->>'id')::uuid;
  end loop;

  for correction in select value from jsonb_array_elements(coalesce(p_corrections, '[]'::jsonb)) loop
    select * into corrected
    from public.production_cues
    where id = (correction->>'corrects_cue_id')::uuid and event_id = p_event_id;
    if found then
      restored := public.append_production_cue_internal(
        p_event_id,
        (correction->>'client_cue_id')::uuid,
        'cue_corrected',
        p_occurred_at,
        corrected.recording_session_id,
        null, null, null, null, null,
        p_note,
        true,
        'internal',
        corrected.id,
        jsonb_build_object('correction_action','void','restored_stage_snapshots',true)
      );
      cues := cues || jsonb_build_array(to_jsonb(restored));
    end if;
  end loop;

  update public.event_runtime_state
  set active_entry_id = (
        select id from public.performers where event_id = p_event_id and current = true limit 1
      ),
      active_song_id = null,
      active_song_position = null,
      revision = revision + 1,
      updated_at = now()
  where event_id = p_event_id;

  return jsonb_build_object('cues', cues);
end;
$$;

revoke all on function public.host_apply_show_transition(uuid,text,timestamptz,uuid,uuid,uuid,uuid,integer,text,text,text,jsonb) from public;
revoke all on function public.host_undo_show_transition(uuid,timestamptz,jsonb,jsonb,text) from public;
grant execute on function public.host_apply_show_transition(uuid,text,timestamptz,uuid,uuid,uuid,uuid,integer,text,text,text,jsonb) to authenticated;
grant execute on function public.host_undo_show_transition(uuid,timestamptz,jsonb,jsonb,text) to authenticated;

commit;
