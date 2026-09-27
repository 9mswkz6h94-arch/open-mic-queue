begin;

create or replace function public.host_apply_show_transition(
  p_event_id uuid, p_transition text, p_occurred_at timestamptz,
  p_recording_session_id uuid, p_entry_id uuid default null,
  p_next_entry_id uuid default null, p_song_id uuid default null,
  p_song_position integer default null, p_song_label text default null,
  p_interval_type text default null, p_note text default null,
  p_cue_ids jsonb default '{}'::jsonb
) returns jsonb language plpgsql security definer set search_path='' as $$
declare
  r public.event_runtime_state;
  performer public.performers;
  next_performer public.performers;
  active_performer public.performers;
  c public.production_cues;
  result jsonb := '[]'::jsonb;
  cid uuid;
begin
  if not public.has_active_event_role(p_event_id,array['host','cohost']) then raise exception 'Host or cohost role required'; end if;
  perform 1 from public.events where id=p_event_id for update;
  if not found then raise exception 'Event not found'; end if;
  if p_recording_session_id is not null and not exists(select 1 from public.recording_sessions where id=p_recording_session_id and event_id=p_event_id and ended_at is null) then raise exception 'Active recording session does not belong to event'; end if;
  if p_entry_id is not null then select * into performer from public.performers where id=p_entry_id and event_id=p_event_id for update; if not found then raise exception 'Performer entry does not belong to event'; end if; end if;
  if p_next_entry_id is not null then select * into next_performer from public.performers where id=p_next_entry_id and event_id=p_event_id for update; if not found then raise exception 'Next performer entry does not belong to event'; end if; end if;
  if p_song_id is not null and not exists(select 1 from public.entry_songs s join public.performers p on p.id=s.entry_id where s.id=p_song_id and p.event_id=p_event_id) then raise exception 'Song does not belong to event'; end if;

  insert into public.event_runtime_state(event_id,recording_session_id,active_entry_id)
  values(p_event_id,p_recording_session_id,(select id from public.performers where event_id=p_event_id and current=true limit 1))
  on conflict(event_id) do nothing;
  select * into r from public.event_runtime_state where event_id=p_event_id for update;
  if r.active_entry_id is not null then select * into active_performer from public.performers where id=r.active_entry_id for update; end if;
  if active_performer.id is null then select * into active_performer from public.performers where event_id=p_event_id and current=true limit 1 for update; end if;

  if p_transition='performer_start' then
    if performer.id is null then raise exception 'Performer entry required'; end if;
    if active_performer.id is not null and active_performer.id<>performer.id then
      cid := (p_cue_ids->>'performer_ended')::uuid; if cid is null then raise exception 'performer_ended cue id required'; end if;
      update public.performers set current=false,attended=true,entry_status='performed',completed_at=p_occurred_at where id=active_performer.id;
      c:=public.append_production_cue_internal(p_event_id,cid,'performer_ended',p_occurred_at,p_recording_session_id,active_performer.id,null,null,active_performer.stage_name,null,p_note,false,'internal',null,'{}'); result:=result||jsonb_build_array(to_jsonb(c));
    end if;
    cid := (p_cue_ids->>'performer_started')::uuid; if cid is null then raise exception 'performer_started cue id required'; end if;
    update public.performers set current=false where event_id=p_event_id and current=true and id<>performer.id;
    update public.performers set current=true,attended=false,entry_status='performing',started_at=p_occurred_at,completed_at=null where id=performer.id;
    c:=public.append_production_cue_internal(p_event_id,cid,'performer_started',p_occurred_at,p_recording_session_id,performer.id,null,null,performer.stage_name,null,p_note,false,'internal',null,'{}'); result:=result||jsonb_build_array(to_jsonb(c));
    update public.event_runtime_state set active_entry_id=performer.id,active_song_id=null,active_song_position=null,revision=revision+1,updated_at=now() where event_id=p_event_id;

  elsif p_transition='performer_advance' then
    if performer.id is null then raise exception 'Performer entry required'; end if;
    if r.active_song_position is not null then
      cid := (p_cue_ids->>'song_ended')::uuid; if cid is null then raise exception 'song_ended cue id required'; end if;
      c:=public.append_production_cue_internal(p_event_id,cid,'song_ended',p_occurred_at,p_recording_session_id,performer.id,r.active_song_id,r.active_song_position,performer.stage_name,null,p_note,false,'internal',null,'{}'); result:=result||jsonb_build_array(to_jsonb(c));
    end if;
    cid := (p_cue_ids->>'performer_ended')::uuid; if cid is null then raise exception 'performer_ended cue id required'; end if;
    update public.performers set current=false,attended=true,entry_status='performed',completed_at=p_occurred_at where id=performer.id;
    c:=public.append_production_cue_internal(p_event_id,cid,'performer_ended',p_occurred_at,p_recording_session_id,performer.id,null,null,performer.stage_name,null,p_note,false,'internal',null,'{}'); result:=result||jsonb_build_array(to_jsonb(c));
    if next_performer.id is not null then
      cid := (p_cue_ids->>'performer_started')::uuid; if cid is null then raise exception 'performer_started cue id required'; end if;
      update public.performers set current=true,attended=false,entry_status='performing',started_at=p_occurred_at,completed_at=null where id=next_performer.id;
      c:=public.append_production_cue_internal(p_event_id,cid,'performer_started',p_occurred_at,p_recording_session_id,next_performer.id,null,null,next_performer.stage_name,null,p_note,false,'internal',null,'{}'); result:=result||jsonb_build_array(to_jsonb(c));
    end if;
    update public.event_runtime_state set active_entry_id=next_performer.id,active_song_id=null,active_song_position=null,revision=revision+1,updated_at=now() where event_id=p_event_id;

  elsif p_transition='song_start' then
    if r.active_entry_id is distinct from performer.id then raise exception 'Performer is not active for event'; end if;
    if r.active_song_position is not null then
      cid := (p_cue_ids->>'song_ended')::uuid; if cid is null then raise exception 'song_ended cue id required'; end if;
      c:=public.append_production_cue_internal(p_event_id,cid,'song_ended',p_occurred_at,p_recording_session_id,performer.id,r.active_song_id,r.active_song_position,performer.stage_name,null,p_note,false,'internal',null,'{}'); result:=result||jsonb_build_array(to_jsonb(c));
    end if;
    cid := (p_cue_ids->>'song_started')::uuid; if cid is null then raise exception 'song_started cue id required'; end if;
    c:=public.append_production_cue_internal(p_event_id,cid,'song_started',p_occurred_at,p_recording_session_id,performer.id,p_song_id,p_song_position,performer.stage_name,p_song_label,p_note,false,'internal',null,'{}'); result:=result||jsonb_build_array(to_jsonb(c));
    update public.event_runtime_state set active_song_id=p_song_id,active_song_position=p_song_position,revision=revision+1,updated_at=now() where event_id=p_event_id;

  elsif p_transition='song_end' then
    if r.active_song_position is not null then
      cid := (p_cue_ids->>'song_ended')::uuid; if cid is null then raise exception 'song_ended cue id required'; end if;
      c:=public.append_production_cue_internal(p_event_id,cid,'song_ended',p_occurred_at,p_recording_session_id,r.active_entry_id,r.active_song_id,r.active_song_position,active_performer.stage_name,null,p_note,false,'internal',null,'{}'); result:=result||jsonb_build_array(to_jsonb(c));
    end if;
    update public.event_runtime_state set active_song_id=null,active_song_position=null,revision=revision+1,updated_at=now() where event_id=p_event_id;

  elsif p_transition='gap_set' then
    if p_interval_type is not null and p_interval_type not in ('changeover','host_mc','technical_delay','intermission','unplanned_gap') then raise exception 'Unsupported interval type'; end if;
    if r.open_interval_type is not null then
      cid := (p_cue_ids->>'gap_ended')::uuid; if cid is null then raise exception 'gap_ended cue id required'; end if;
      c:=public.append_production_cue_internal(p_event_id,cid,r.open_interval_type||'_ended',p_occurred_at,p_recording_session_id,null,null,null,null,null,p_note,true,'internal',null,'{}'); result:=result||jsonb_build_array(to_jsonb(c));
    end if;
    if p_interval_type is not null and p_interval_type is distinct from r.open_interval_type then
      cid := (p_cue_ids->>'gap_started')::uuid; if cid is null then raise exception 'gap_started cue id required'; end if;
      c:=public.append_production_cue_internal(p_event_id,cid,p_interval_type||'_started',p_occurred_at,p_recording_session_id,null,null,null,null,null,p_note,true,'internal',null,'{}'); result:=result||jsonb_build_array(to_jsonb(c));
      update public.event_runtime_state set open_interval_type=p_interval_type,open_interval_cue_id=c.id,revision=revision+1,updated_at=now() where event_id=p_event_id;
    else
      update public.event_runtime_state set open_interval_type=null,open_interval_cue_id=null,revision=revision+1,updated_at=now() where event_id=p_event_id;
    end if;
  else raise exception 'Unsupported transition: %',p_transition;
  end if;
  return jsonb_build_object('cues',result);
end; $$;

create or replace function public.host_undo_show_transition(p_event_id uuid,p_occurred_at timestamptz,p_client_cue_id uuid,p_corrects_cue_id uuid,p_snapshots jsonb,p_note text default null)
returns public.production_cues language plpgsql security definer set search_path='' as $$
declare s jsonb; c public.production_cues;
begin
  if not public.has_active_event_role(p_event_id,array['host','cohost']) then raise exception 'Host or cohost role required'; end if;
  perform 1 from public.events where id=p_event_id for update;
  for s in select value from jsonb_array_elements(p_snapshots) loop
    if not exists(select 1 from public.performers where id=(s->>'id')::uuid and event_id=p_event_id for update) then raise exception 'Undo entry does not belong to event'; end if;
    update public.performers set current=(s->>'current')::boolean,attended=(s->>'attended')::boolean,queue_position=(s->>'queue_position')::integer,started_at=(s->>'started_at')::timestamptz,completed_at=(s->>'completed_at')::timestamptz,entry_status=case when (s->>'attended')::boolean then 'performed' when (s->>'current')::boolean then 'performing' else 'queued' end where id=(s->>'id')::uuid;
  end loop;
  c:=public.append_production_cue_internal(p_event_id,p_client_cue_id,'cue_corrected',p_occurred_at,null,null,null,null,null,null,p_note,true,'internal',p_corrects_cue_id,jsonb_build_object('correction_action','restore_stage_snapshots'));
  update public.event_runtime_state set active_entry_id=(select id from public.performers where event_id=p_event_id and current=true limit 1),active_song_id=null,active_song_position=null,revision=revision+1,updated_at=now() where event_id=p_event_id;
  return c;
end; $$;

revoke all on function public.host_apply_show_transition(uuid,text,timestamptz,uuid,uuid,uuid,uuid,integer,text,text,text,jsonb) from public;
revoke all on function public.host_undo_show_transition(uuid,timestamptz,uuid,uuid,jsonb,text) from public;
grant execute on function public.host_apply_show_transition(uuid,text,timestamptz,uuid,uuid,uuid,uuid,integer,text,text,text,jsonb) to authenticated;
grant execute on function public.host_undo_show_transition(uuid,timestamptz,uuid,uuid,jsonb,text) to authenticated;
commit;
