\set ON_ERROR_STOP on

begin;

insert into auth.users (id, email, aud, role, created_at, updated_at)
values
  ('10000000-0000-4000-8000-000000000001', 'host@example.test', 'authenticated', 'authenticated', now(), now()),
  ('10000000-0000-4000-8000-000000000002', 'cohost@example.test', 'authenticated', 'authenticated', now(), now()),
  ('10000000-0000-4000-8000-000000000003', 'outsider@example.test', 'authenticated', 'authenticated', now(), now())
on conflict (id) do nothing;

insert into public.profiles (id, display_name, email)
values
  ('10000000-0000-4000-8000-000000000001', 'Test Host', 'host@example.test'),
  ('10000000-0000-4000-8000-000000000002', 'Test Cohost', 'cohost@example.test'),
  ('10000000-0000-4000-8000-000000000003', 'Test Outsider', 'outsider@example.test')
on conflict (id) do nothing;

insert into public.event_roles (event_id, profile_id, role, granted_by)
values
  ('00000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', 'host', '10000000-0000-4000-8000-000000000001'),
  ('00000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', 'cohost', '10000000-0000-4000-8000-000000000001')
on conflict do nothing;

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);

insert into public.display_prompts (
  id, event_id, prompt_type, region, content, status, created_by
) values (
  '20000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000002',
  'announcement', 'ticker', '{"message":"Signup closes in 10 minutes."}'::jsonb,
  'draft', '10000000-0000-4000-8000-000000000001'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000003', true);

do $$
begin
  begin
    insert into public.display_prompts (event_id, prompt_type, region, content, status, created_by)
    values (
      '00000000-0000-4000-8000-000000000002', 'announcement', 'ticker',
      '{"message":"Unauthorized"}'::jsonb, 'draft', '10000000-0000-4000-8000-000000000003'
    );
    raise exception 'outsider unexpectedly created a display prompt';
  exception when insufficient_privilege then
    null;
  end;
end;
$$;

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);

update public.display_prompts
set status = 'previewed'
where id = '20000000-0000-4000-8000-000000000001';

update public.display_prompts
set status = 'published',
    published_by = '10000000-0000-4000-8000-000000000002',
    published_at = now(),
    expires_at = now() + interval '5 minutes'
where id = '20000000-0000-4000-8000-000000000001';

do $$
begin
  begin
    update public.display_prompts
    set content = '{"message":"Changed after publication"}'::jsonb
    where id = '20000000-0000-4000-8000-000000000001';
    raise exception 'published prompt copy unexpectedly changed';
  exception when others then
    if sqlerrm = 'published prompt copy unexpectedly changed' then raise; end if;
  end;
end;
$$;

reset role;

do $$
begin
  if (select count(*) from public.audit_events where target_id = '20000000-0000-4000-8000-000000000001') <> 3 then
    raise exception 'expected three audit events through publication';
  end if;
  if (select count(*) from public.production_cues where metadata ->> 'display_prompt_id' = '20000000-0000-4000-8000-000000000001') <> 1 then
    raise exception 'expected one publication cue';
  end if;
end;
$$;

set local role anon;
select set_config('request.jwt.claim.sub', '', true);

do $$
begin
  if (select count(*) from public.public_active_display_prompts where id = '20000000-0000-4000-8000-000000000001') <> 1 then
    raise exception 'anon active-prompt allowlist did not return the published prompt';
  end if;
  begin
    perform count(*) from public.display_prompts;
    raise exception 'anon unexpectedly read the private prompt table';
  exception when insufficient_privilege then
    null;
  end;
end;
$$;

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);

update public.display_prompts
set status = 'cleared', cleared_at = now()
where id = '20000000-0000-4000-8000-000000000001';

reset role;

do $$
begin
  if exists (select 1 from public.public_active_display_prompts where id = '20000000-0000-4000-8000-000000000001') then
    raise exception 'cleared prompt remained public';
  end if;
  if (select count(*) from public.production_cues where metadata ->> 'display_prompt_id' = '20000000-0000-4000-8000-000000000001') <> 2 then
    raise exception 'expected publication and clear cues';
  end if;

  begin
    insert into public.supporter_acknowledgements (
      event_id, display_name, approved_message, display_permission, moderation_status, published_at
    ) values (
      '00000000-0000-4000-8000-000000000002', 'No Permission', 'Unsafe', false, 'approved', now()
    );
    raise exception 'supporter acknowledgement published without permission';
  exception when check_violation then
    null;
  end;
end;
$$;

insert into public.supporter_acknowledgements (
  id, event_id, display_name, approved_message, display_permission, moderation_status, published_at, expires_at
) values (
  '30000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000002',
  'Sam', 'Thanks to Sam for supporting local music.', true, 'approved', now(), now() + interval '5 minutes'
);

delete from public.production_cues where metadata ->> 'display_prompt_id' = '20000000-0000-4000-8000-000000000001';
delete from public.audit_events where target_id = '20000000-0000-4000-8000-000000000001';
delete from public.display_prompts where id = '20000000-0000-4000-8000-000000000001';
delete from public.supporter_acknowledgements where id = '30000000-0000-4000-8000-000000000001';
delete from public.event_roles where profile_id in (
  '10000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000002',
  '10000000-0000-4000-8000-000000000003'
);
delete from public.profiles where id in (
  '10000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000002',
  '10000000-0000-4000-8000-000000000003'
);
delete from auth.users where id in (
  '10000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000002',
  '10000000-0000-4000-8000-000000000003'
);

commit;

select 'functional display prompt permissions passed' result;
