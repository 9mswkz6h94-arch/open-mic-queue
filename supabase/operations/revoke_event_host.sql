-- Recoverable counterpart to bootstrap_event_host.sql.
-- Invoke with: -v host_user_id='uuid' -v event_id='uuid'
-- This revokes the event role but deliberately retains the person's account/profile.

begin;

select set_config('app.bootstrap.host_user_id', :'host_user_id', true);
select set_config('app.bootstrap.event_id', :'event_id', true);

do $$
begin
  if not exists (
    select 1
    from public.event_roles
    where event_id = current_setting('app.bootstrap.event_id')::uuid
      and profile_id = current_setting('app.bootstrap.host_user_id')::uuid
      and role = 'host'
      and revoked_at is null
  ) then
    raise exception 'No active matching host role was found to revoke.';
  end if;
end
$$;

update public.event_roles
set revoked_at = now()
where event_id = :'event_id'::uuid
  and profile_id = :'host_user_id'::uuid
  and role = 'host'
  and revoked_at is null;

select event_id, profile_id, role, granted_by, granted_at, revoked_at
from public.event_roles
where event_id = :'event_id'::uuid
  and profile_id = :'host_user_id'::uuid
  and role = 'host';

commit;
