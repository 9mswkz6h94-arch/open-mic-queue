-- Privileged one-time operation. Invoke with psql variables:
--   -v host_user_id='uuid' -v event_id='uuid' -v operator_user_id='uuid'
-- Never hardcode account identifiers in the repository.

begin;

select set_config('app.bootstrap.host_user_id', :'host_user_id', true);
select set_config('app.bootstrap.event_id', :'event_id', true);
select set_config('app.bootstrap.operator_user_id', :'operator_user_id', true);

do $$
begin
  if current_user not in ('postgres', 'supabase_admin') then
    raise exception 'Event-host bootstrap requires a privileged database operator.';
  end if;
end
$$;

insert into public.profiles (id, display_name, email)
select
  u.id,
  coalesce(nullif(btrim(u.raw_user_meta_data ->> 'display_name'), ''), 'Event host'),
  u.email
from auth.users u
where u.id = :'host_user_id'::uuid
on conflict (id) do nothing;

do $$
begin
  if not exists (select 1 from auth.users where id = current_setting('app.bootstrap.host_user_id')::uuid) then
    raise exception 'Named host auth user does not exist.';
  end if;
  if not exists (select 1 from public.profiles where id = current_setting('app.bootstrap.host_user_id')::uuid and deleted_at is null) then
    raise exception 'Named host profile is unavailable.';
  end if;
  if not exists (select 1 from public.events where id = current_setting('app.bootstrap.event_id')::uuid) then
    raise exception 'Target event does not exist.';
  end if;
  if not exists (select 1 from public.profiles where id = current_setting('app.bootstrap.operator_user_id')::uuid and deleted_at is null) then
    raise exception 'Granting operator profile does not exist.';
  end if;
end
$$;

insert into public.event_roles (event_id, profile_id, role, granted_by)
values (
  :'event_id'::uuid,
  :'host_user_id'::uuid,
  'host',
  :'operator_user_id'::uuid
)
on conflict (event_id, profile_id, role)
do update set
  revoked_at = null,
  granted_by = excluded.granted_by,
  granted_at = now();

select
  er.event_id,
  e.slug as event_slug,
  er.profile_id,
  p.display_name,
  er.role,
  er.granted_by,
  er.granted_at,
  er.revoked_at
from public.event_roles er
join public.events e on e.id = er.event_id
join public.profiles p on p.id = er.profile_id
where er.event_id = :'event_id'::uuid
  and er.profile_id = :'host_user_id'::uuid
  and er.role = 'host';

commit;
