\set ON_ERROR_STOP on

do $$
declare
  seeded_count integer;
  unprotected_count integer;
begin
  if to_regclass('public.contact_points') is null
    or to_regclass('public.notification_endpoints') is null
    or to_regclass('public.contact_suppressions') is null
    or to_regclass('public.notification_deliveries') is null then
    raise exception 'one or more future communication containers are missing';
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'subscriptions' and column_name = 'purpose'
  ) or not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'subscriptions' and column_name = 'contact_point_id'
  ) then
    raise exception 'subscription future-purpose/contact linkage is missing';
  end if;

  select
    (select count(*) from public.contact_points)
    + (select count(*) from public.notification_endpoints)
    + (select count(*) from public.contact_suppressions)
    + (select count(*) from public.notification_deliveries)
  into seeded_count;
  if seeded_count <> 0 then
    raise exception 'future communication migration unexpectedly seeded % rows', seeded_count;
  end if;

  select count(*) into unprotected_count
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname in ('contact_points','notification_endpoints','contact_suppressions','notification_deliveries')
    and c.relrowsecurity is not true;
  if unprotected_count <> 0 then
    raise exception '% future communication tables do not have RLS enabled', unprotected_count;
  end if;

  if exists (
    select 1 from information_schema.role_table_grants
    where table_schema = 'public'
      and table_name in ('contact_points','notification_endpoints','contact_suppressions','notification_deliveries')
      and grantee = 'anon'
  ) then
    raise exception 'anonymous grants exist on restricted communication containers';
  end if;

  raise notice 'future contact verification passed: containers present, empty, RLS enabled, no anon grants';
end;
$$;

