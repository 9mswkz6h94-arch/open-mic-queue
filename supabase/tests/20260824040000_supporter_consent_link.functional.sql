\set ON_ERROR_STOP on

begin;

insert into auth.users (id, email, aud, role, created_at, updated_at)
values
  ('41000000-0000-4000-8000-000000000001', 'supporter-host@example.test', 'authenticated', 'authenticated', now(), now()),
  ('41000000-0000-4000-8000-000000000002', 'supporter-outsider@example.test', 'authenticated', 'authenticated', now(), now())
on conflict (id) do nothing;

insert into public.profiles (id, display_name, email)
values
  ('41000000-0000-4000-8000-000000000001', 'Supporter Host', 'supporter-host@example.test'),
  ('41000000-0000-4000-8000-000000000002', 'Supporter Outsider', 'supporter-outsider@example.test')
on conflict (id) do nothing;

insert into public.event_roles (event_id, profile_id, role, granted_by)
values (
  '00000000-0000-4000-8000-000000000002',
  '41000000-0000-4000-8000-000000000001', 'host',
  '41000000-0000-4000-8000-000000000001'
) on conflict do nothing;

set local role authenticated;
select set_config('request.jwt.claim.sub', '41000000-0000-4000-8000-000000000001', true);

select public.create_supporter_display_prompt(
  '00000000-0000-4000-8000-000000000002',
  'Sam',
  'Thanks to Sam for supporting local music.',
  'in_person_host_confirmation',
  '{"confirmed_exact_name_and_message":true}'::jsonb
);

do $$
begin
  if not exists (
    select 1
    from public.display_prompts dp
    join public.supporter_acknowledgements sa on sa.id=dp.supporter_acknowledgement_id
    join public.consent_records cr on cr.id=sa.consent_record_id
    where dp.created_by='41000000-0000-4000-8000-000000000001'
      and dp.status='draft'
      and sa.display_permission is true
      and sa.moderation_status='approved'
      and cr.granted is true
      and cr.revoked_at is null
      and cr.purpose='supporter_public_recognition'
      and cr.subject_display_name='Sam'
  ) then raise exception 'atomic supporter chain was not created'; end if;
end;
$$;

update public.display_prompts set status='previewed'
where created_by='41000000-0000-4000-8000-000000000001'
  and prompt_type='supporter_acknowledgement';
update public.display_prompts
set status='published', published_by='41000000-0000-4000-8000-000000000001',
    published_at=now(), expires_at=now()+interval '5 minutes'
where created_by='41000000-0000-4000-8000-000000000001'
  and prompt_type='supporter_acknowledgement';

do $$
begin
  begin
    insert into public.display_prompts (
      event_id,prompt_type,region,content,status,created_by,supporter_acknowledgement_id
    )
    select event_id,'supporter_acknowledgement','right_rail','{"message":"Altered copy"}'::jsonb,
           'draft','41000000-0000-4000-8000-000000000001',id
    from public.supporter_acknowledgements where display_name='Sam';
    raise exception 'mismatched supporter copy unexpectedly accepted';
  exception when others then
    if sqlerrm='mismatched supporter copy unexpectedly accepted' then raise; end if;
  end;
end;
$$;

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '41000000-0000-4000-8000-000000000002', true);

do $$
begin
  begin
    perform public.create_supporter_display_prompt(
      '00000000-0000-4000-8000-000000000002','Unsafe','Unsafe','claimed','{}'::jsonb
    );
    raise exception 'outsider unexpectedly created supporter prompt';
  exception when others then
    if sqlerrm='outsider unexpectedly created supporter prompt' then raise; end if;
  end;
end;
$$;

reset role;
delete from public.production_cues where metadata->>'display_prompt_id' in (
  select id::text from public.display_prompts where created_by='41000000-0000-4000-8000-000000000001'
);
delete from public.audit_events where target_id in (
  select id from public.display_prompts where created_by='41000000-0000-4000-8000-000000000001'
);
delete from public.display_prompts where created_by='41000000-0000-4000-8000-000000000001';
delete from public.supporter_acknowledgements where display_name='Sam' and event_id='00000000-0000-4000-8000-000000000002';
delete from public.consent_records where subject_display_name='Sam' and event_id='00000000-0000-4000-8000-000000000002';
delete from public.event_roles where profile_id in ('41000000-0000-4000-8000-000000000001','41000000-0000-4000-8000-000000000002');
delete from public.profiles where id in ('41000000-0000-4000-8000-000000000001','41000000-0000-4000-8000-000000000002');
delete from auth.users where id in ('41000000-0000-4000-8000-000000000001','41000000-0000-4000-8000-000000000002');

commit;

select 'supporter consent link functional test passed' result;
