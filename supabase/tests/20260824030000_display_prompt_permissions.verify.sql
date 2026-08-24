\set ON_ERROR_STOP on

do $$
declare
  expected_policies text[] := array[
    'event_roles_read_assigned_event',
    'event_roles_manage_by_host',
    'event_roles_update_by_host',
    'display_prompts_read_event_staff',
    'display_prompts_create_event_staff',
    'display_prompts_update_event_staff',
    'supporter_acknowledgements_read_event_staff',
    'supporter_acknowledgements_create_event_staff',
    'supporter_acknowledgements_update_event_staff',
    'production_cues_read_event_staff',
    'audit_events_read_event_host'
  ];
  policy_name text;
begin
  foreach policy_name in array expected_policies loop
    if not exists (select 1 from pg_policies where schemaname = 'public' and policyname = policy_name) then
      raise exception 'missing policy %', policy_name;
    end if;
  end loop;

  if not exists (
    select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'public_active_display_prompts' and c.relkind = 'v'
  ) then raise exception 'public prompt allowlist view missing'; end if;

  if exists (
    select 1 from information_schema.role_table_grants
    where table_schema = 'public'
      and table_name in ('display_prompts','supporter_acknowledgements','production_cues','audit_events')
      and grantee = 'anon'
  ) then raise exception 'anon has a direct private-table grant'; end if;

  if not exists (
    select 1 from information_schema.role_table_grants
    where table_schema = 'public' and table_name = 'public_active_display_prompts'
      and grantee = 'anon' and privilege_type = 'SELECT'
  ) then raise exception 'anon cannot read the public prompt allowlist'; end if;

  if not exists (
    select 1 from pg_trigger
    where tgname = 'display_prompts_validate_transition' and not tgisinternal
  ) then raise exception 'transition validator trigger missing'; end if;

  if not exists (
    select 1 from pg_trigger
    where tgname = 'display_prompts_log_transition' and not tgisinternal
  ) then raise exception 'transition logger trigger missing'; end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'supporter_acknowledgements_publication_check' and convalidated
  ) then raise exception 'supporter publication constraint missing or unvalidated'; end if;

  raise notice 'display prompt permission structure verified';
end;
$$;

select policyname, tablename, cmd
from pg_policies
where schemaname = 'public'
  and policyname like any (array['event_roles_%','display_prompts_%','supporter_acknowledgements_%','production_cues_%','audit_events_%'])
order by tablename, policyname;
