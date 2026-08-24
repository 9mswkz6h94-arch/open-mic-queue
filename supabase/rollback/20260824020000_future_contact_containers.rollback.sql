begin;

do $$
begin
  if exists (select 1 from public.contact_points)
    or exists (select 1 from public.notification_endpoints)
    or exists (select 1 from public.contact_suppressions)
    or exists (select 1 from public.notification_deliveries) then
    raise exception 'Rollback blocked: future communication containers contain data.';
  end if;

  if exists (
    select 1 from public.subscriptions
    where channel not in ('email','sms')
       or status not in ('pending','active','unsubscribed','bounced','complained')
       or event_id is not null or contact_point_id is not null or consent_record_id is not null
       or paused_at is not null or metadata <> '{}'::jsonb
       or purpose <> 'future_events'
  ) then
    raise exception 'Rollback blocked: subscriptions use future communication fields.';
  end if;
end;
$$;

drop policy if exists notification_deliveries_read_own on public.notification_deliveries;
drop policy if exists contact_suppressions_read_own on public.contact_suppressions;
drop policy if exists notification_endpoints_read_own on public.notification_endpoints;
drop policy if exists contact_points_read_own on public.contact_points;
drop policy if exists subscriptions_read_own on public.subscriptions;

drop table public.notification_deliveries;
drop table public.contact_suppressions;
drop table public.notification_endpoints;

alter table public.subscriptions drop constraint subscriptions_activation_evidence_check;
alter table public.subscriptions drop constraint subscriptions_channel_check;
alter table public.subscriptions drop constraint subscriptions_status_check;
alter table public.subscriptions
  drop column metadata,
  drop column paused_at,
  drop column consent_record_id,
  drop column contact_point_id,
  drop column event_id,
  drop column purpose,
  add constraint subscriptions_channel_check check (channel in ('email','sms')),
  add constraint subscriptions_status_check
    check (status in ('pending','active','unsubscribed','bounced','complained'));

drop table public.contact_points;
comment on column public.profiles.phone_e164 is null;

commit;

