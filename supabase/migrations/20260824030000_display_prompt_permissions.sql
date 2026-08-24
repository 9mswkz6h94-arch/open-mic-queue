begin;

create or replace function public.has_active_event_role(target_event_id uuid, allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.event_roles er
    where er.event_id = target_event_id
      and er.profile_id = auth.uid()
      and er.role = any (allowed_roles)
      and er.revoked_at is null
  );
$$;

revoke all on function public.has_active_event_role(uuid, text[]) from public;
grant execute on function public.has_active_event_role(uuid, text[]) to authenticated;

alter table public.supporter_acknowledgements
  add constraint supporter_acknowledgements_publication_check
  check (
    published_at is null
    or (display_permission is true and moderation_status = 'approved')
  ) not valid;
alter table public.supporter_acknowledgements validate constraint supporter_acknowledgements_publication_check;

create or replace function public.validate_display_prompt_transition()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if new.status <> 'draft' then
      raise exception 'Display prompts must begin as drafts.';
    end if;
    if new.created_by is distinct from auth.uid() then
      raise exception 'created_by must match the authenticated operator.';
    end if;
    return new;
  end if;

  if old.status = 'published' and (
    new.prompt_type is distinct from old.prompt_type
    or new.region is distinct from old.region
    or new.content is distinct from old.content
  ) then
    raise exception 'Published prompt copy and placement are immutable.';
  end if;

  if new.status is distinct from old.status and not (
    (old.status = 'draft' and new.status in ('previewed', 'cleared'))
    or (old.status = 'previewed' and new.status in ('draft', 'published', 'cleared'))
    or (old.status = 'published' and new.status in ('expired', 'cleared'))
  ) then
    raise exception 'Invalid display prompt transition: % to %.', old.status, new.status;
  end if;

  if new.status = 'published' and old.status is distinct from 'published' then
    if new.published_by is distinct from auth.uid() then
      raise exception 'published_by must match the authenticated operator.';
    end if;
    if new.published_at is null or new.expires_at is null or new.expires_at <= new.published_at then
      raise exception 'Published prompts require a future expiry.';
    end if;
  end if;

  if new.status = 'cleared' and new.cleared_at is null then
    raise exception 'Cleared prompts require cleared_at.';
  end if;

  return new;
end;
$$;

create trigger display_prompts_validate_transition
before insert or update on public.display_prompts
for each row execute function public.validate_display_prompt_transition();

create or replace function public.log_display_prompt_transition()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  transition_action text;
begin
  if tg_op = 'INSERT' then
    transition_action := 'display_prompt.draft_created';
  elsif new.status is distinct from old.status then
    transition_action := 'display_prompt.' || new.status;
  else
    return new;
  end if;

  insert into public.audit_events (
    event_id, actor_profile_id, action, target_type, target_id, metadata
  ) values (
    new.event_id,
    auth.uid(),
    transition_action,
    'display_prompt',
    new.id,
    jsonb_build_object(
      'prompt_type', new.prompt_type,
      'region', new.region,
      'status', new.status
    )
  );

  if new.status in ('published', 'expired', 'cleared') then
    insert into public.production_cues (
      event_id, operator_profile_id, cue_type, occurred_at, source, label, metadata
    ) values (
      new.event_id,
      auth.uid(),
      'tv_prompt_' || new.status,
      now(),
      'host_hud',
      coalesce(new.content ->> 'message', new.prompt_type),
      jsonb_build_object(
        'display_prompt_id', new.id,
        'prompt_type', new.prompt_type,
        'region', new.region,
        'status', new.status
      )
    );
  end if;

  return new;
end;
$$;

create trigger display_prompts_log_transition
after insert or update on public.display_prompts
for each row execute function public.log_display_prompt_transition();

create policy event_roles_read_assigned_event
on public.event_roles for select to authenticated
using (
  profile_id = auth.uid()
  or public.has_active_event_role(event_id, array['host','cohost'])
);

create policy event_roles_manage_by_host
on public.event_roles for insert to authenticated
with check (
  public.has_active_event_role(event_id, array['host'])
  and granted_by = auth.uid()
);

create policy event_roles_update_by_host
on public.event_roles for update to authenticated
using (public.has_active_event_role(event_id, array['host']))
with check (public.has_active_event_role(event_id, array['host']));

create policy display_prompts_read_event_staff
on public.display_prompts for select to authenticated
using (public.has_active_event_role(event_id, array['host','cohost']));

create policy display_prompts_create_event_staff
on public.display_prompts for insert to authenticated
with check (
  public.has_active_event_role(event_id, array['host','cohost'])
  and created_by = auth.uid()
  and status = 'draft'
);

create policy display_prompts_update_event_staff
on public.display_prompts for update to authenticated
using (public.has_active_event_role(event_id, array['host','cohost']))
with check (public.has_active_event_role(event_id, array['host','cohost']));

create policy supporter_acknowledgements_read_event_staff
on public.supporter_acknowledgements for select to authenticated
using (public.has_active_event_role(event_id, array['host','cohost']));

create policy supporter_acknowledgements_create_event_staff
on public.supporter_acknowledgements for insert to authenticated
with check (
  public.has_active_event_role(event_id, array['host','cohost'])
  and published_at is null
  and moderation_status = 'draft'
);

create policy supporter_acknowledgements_update_event_staff
on public.supporter_acknowledgements for update to authenticated
using (public.has_active_event_role(event_id, array['host','cohost']))
with check (public.has_active_event_role(event_id, array['host','cohost']));

create policy production_cues_read_event_staff
on public.production_cues for select to authenticated
using (public.has_active_event_role(event_id, array['host','cohost']));

create policy audit_events_read_event_host
on public.audit_events for select to authenticated
using (public.has_active_event_role(event_id, array['host']));

revoke all on public.display_prompts from anon;
revoke all on public.supporter_acknowledgements from anon;
revoke all on public.production_cues from anon;
revoke all on public.audit_events from anon;

create view public.public_active_display_prompts
with (security_barrier = true)
as
select
  dp.id,
  e.slug event_slug,
  dp.prompt_type,
  dp.region,
  dp.priority,
  dp.content,
  dp.published_at,
  dp.expires_at
from public.display_prompts dp
join public.events e on e.id = dp.event_id
where dp.status = 'published'
  and dp.published_at is not null
  and (dp.expires_at is null or dp.expires_at > now())
  and e.status in ('open','running');

revoke all on public.public_active_display_prompts from public;
grant select on public.public_active_display_prompts to anon, authenticated;

comment on view public.public_active_display_prompts is
  'Public allowlist for currently published, non-expired display prompts. Direct prompt/supporter tables remain private.';

commit;
