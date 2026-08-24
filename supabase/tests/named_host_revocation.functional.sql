\set ON_ERROR_STOP on

begin;

set local role authenticated;
select set_config('request.jwt.claim.sub', '30000000-0000-4000-8000-000000000002', true);

do $$
begin
  if public.has_active_event_role(
    '00000000-0000-4000-8000-000000000002',
    array['host']
  ) then
    raise exception 'named host authority remained active after revocation';
  end if;

  begin
    insert into public.display_prompts (
      event_id, prompt_type, region, content, status, created_by
    ) values (
      '00000000-0000-4000-8000-000000000002',
      'announcement',
      'ticker',
      '{"message":"Must be rejected"}'::jsonb,
      'draft',
      '30000000-0000-4000-8000-000000000002'
    );
    raise exception 'revoked host unexpectedly created a prompt';
  exception when insufficient_privilege then
    null;
  end;
end
$$;

reset role;
rollback;

select 'named host revocation denial passed' as result;
