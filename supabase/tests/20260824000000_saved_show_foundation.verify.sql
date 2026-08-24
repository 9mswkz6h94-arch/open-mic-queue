\set ON_ERROR_STOP on

do $$
declare
  performer_count integer;
  linked_count integer;
  song_count integer;
  expected_song_count integer;
  current_count integer;
  reversed_count integer;
begin
  select count(*) into performer_count from public.performers;
  if performer_count = 0 then raise exception 'performer table is empty'; end if;

  select count(*) into linked_count from public.performers
  where event_id is not null and artist_id is not null and round_number > 0
    and entry_status is not null and legacy_migrated_at is not null;
  if linked_count <> performer_count then
    raise exception '% of % performers are fully linked', linked_count, performer_count;
  end if;

  select sum(greatest(coalesce(cardinality(song_titles), 0), 2))::integer
  into expected_song_count from public.performers;
  select count(*) into song_count from public.entry_songs;
  if song_count <> expected_song_count then
    raise exception 'expected % songs, found %', expected_song_count, song_count;
  end if;

  select count(*) into current_count from public.performers where current is true;
  if current_count > 1 then raise exception '% current performers exist', current_count; end if;

  select count(*) into reversed_count from public.performers
  where started_at is not null and completed_at is not null and completed_at < started_at;
  if reversed_count <> 0 then raise exception '% reversed spans exist', reversed_count; end if;

  if exists (
    select 1 from public.performers group by event_id, queue_position having count(*) > 1
  ) then raise exception 'duplicate event queue positions exist'; end if;

  if not exists (select 1 from public.events
    where id = '00000000-0000-4000-8000-000000000002' and timezone = 'America/Chicago')
  then raise exception 'reference event/timezone missing'; end if;

  if exists (
    select 1 from public.entry_songs s join public.performers p on p.id = s.entry_id
    where s.position = 1 and nullif(btrim(s.title), '') is distinct from
      coalesce(
        case when nullif(btrim(p.song_titles[1]), '') ~ '^_+$' then null else nullif(btrim(p.song_titles[1]), '') end,
        case when nullif(btrim(p.song_1_title), '') ~ '^_+$' then null else nullif(btrim(p.song_1_title), '') end
      )
  ) then raise exception 'song position 1 precedence mismatch'; end if;

  raise notice 'verification passed: % performers, % songs, % current, % reversed',
    performer_count, song_count, current_count, reversed_count;
end;
$$;

select count(*) performers,
  count(*) filter (where current is true) current,
  count(*) filter (where attended is true) attended,
  count(*) filter (where attended is not true and current is not true) upcoming
from public.performers;

select count(*) entry_songs,
  count(*) filter (where nullif(btrim(title), '') is null) numbered_fallbacks
from public.entry_songs;
