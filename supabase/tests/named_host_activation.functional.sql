\set ON_ERROR_STOP on

begin;

set local role authenticated;
select set_config('request.jwt.claim.sub', '30000000-0000-4000-8000-000000000002', true);

do $$
begin
  if not public.has_active_event_role(
    '00000000-0000-4000-8000-000000000002',
    array['host']
  ) then
    raise exception 'named host authority was not active';
  end if;
end
$$;

insert into public.display_prompts (
  id, event_id, prompt_type, region, content, status, created_by
) values (
  '40000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000002',
  'announcement',
  'ticker',
  '{"message":"Named host rehearsal"}'::jsonb,
  'draft',
  '30000000-0000-4000-8000-000000000002'
);

update public.display_prompts
set status = 'previewed'
where id = '40000000-0000-4000-8000-000000000001';

update public.display_prompts
set status = 'published',
    published_by = '30000000-0000-4000-8000-000000000002',
    published_at = now(),
    expires_at = now() + interval '5 minutes'
where id = '40000000-0000-4000-8000-000000000001';

update public.display_prompts
set status = 'cleared',
    cleared_at = now()
where id = '40000000-0000-4000-8000-000000000001';

reset role;

do $$
begin
  if (select count(*) from public.audit_events where target_id = '40000000-0000-4000-8000-000000000001') <> 4 then
    raise exception 'expected four named-host audit events';
  end if;
  if (select count(*) from public.production_cues where metadata ->> 'display_prompt_id' = '40000000-0000-4000-8000-000000000001') <> 2 then
    raise exception 'expected named-host publish and clear cues';
  end if;
  if exists (select 1 from public.public_active_display_prompts where id = '40000000-0000-4000-8000-000000000001') then
    raise exception 'cleared named-host prompt remained public';
  end if;
end
$$;

commit;

select 'named host publish workflow passed' as result;
