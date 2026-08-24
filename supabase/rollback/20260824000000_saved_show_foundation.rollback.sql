begin;

-- Restore-lab/pre-cutover rollback only. After operational writes, use the verified backup.
do $$
begin
  if exists (select 1 from public.production_cues)
     or exists (select 1 from public.display_prompts)
     or exists (select 1 from public.featured_spotlights)
     or exists (select 1 from public.supporter_acknowledgements)
     or exists (select 1 from public.audit_events) then
    raise exception 'Rollback blocked: post-migration operational data exists.';
  end if;
  if exists (select 1 from public.events where id <> '00000000-0000-4000-8000-000000000002') then
    raise exception 'Rollback blocked: non-legacy events exist.';
  end if;
end;
$$;

drop view if exists public.public_event_queue;
drop view if exists public.public_event_home;
drop table if exists public.audit_events;
drop table if exists public.supporter_acknowledgements;
drop table if exists public.display_prompts;
drop table if exists public.production_cues;
drop table if exists public.subscriptions;
drop table if exists public.consent_records;
drop table if exists public.featured_spotlights;
drop table if exists public.event_roles;
drop table if exists public.entry_songs;

drop index if exists public.performers_one_current_per_event_idx;
drop index if exists public.performers_event_queue_position_idx;
drop index if exists public.performers_event_artist_round_idx;
drop index if exists public.performers_event_status_position_idx;
alter table public.performers drop constraint if exists performers_time_order_chk;
alter table public.performers drop column if exists legacy_migrated_at;
alter table public.performers drop column if exists locked_by;
alter table public.performers drop column if exists locked_at;
alter table public.performers drop column if exists entry_status;
alter table public.performers drop column if exists entry_role;
alter table public.performers drop column if exists round_number;
alter table public.performers drop column if exists artist_id;
alter table public.performers drop column if exists event_id;

delete from public.events where id = '00000000-0000-4000-8000-000000000002';
delete from public.artist_profiles where id in (select id from public.performers);
delete from public.venues where id = '00000000-0000-4000-8000-000000000001';
drop table public.events;
drop table public.artist_profiles;
drop table public.profiles;
drop function public.set_updated_at();

commit;
