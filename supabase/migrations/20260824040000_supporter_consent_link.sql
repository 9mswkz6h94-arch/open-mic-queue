begin;

alter table public.consent_records
  add column subject_display_name text;

alter table public.consent_records
  drop constraint consent_records_check;

alter table public.consent_records
  add constraint consent_records_subject_check
  check (
    profile_id is not null
    or artist_id is not null
    or entry_id is not null
    or nullif(btrim(subject_display_name), '') is not null
  );

alter table public.supporter_acknowledgements
  add column consent_record_id uuid references public.consent_records(id) on delete restrict;

alter table public.display_prompts
  add column supporter_acknowledgement_id uuid references public.supporter_acknowledgements(id) on delete restrict;

alter table public.display_prompts
  add constraint display_prompts_supporter_link_check
  check (
    (prompt_type = 'supporter_acknowledgement' and supporter_acknowledgement_id is not null)
    or (prompt_type <> 'supporter_acknowledgement' and supporter_acknowledgement_id is null)
  ) not valid;
alter table public.display_prompts validate constraint display_prompts_supporter_link_check;

alter table public.supporter_acknowledgements
  drop constraint supporter_acknowledgements_publication_check;

alter table public.supporter_acknowledgements
  add constraint supporter_acknowledgements_publication_check
  check (
    (moderation_status not in ('approved') and published_at is null)
    or (
      display_permission is true
      and moderation_status = 'approved'
      and consent_record_id is not null
    )
  ) not valid;
alter table public.supporter_acknowledgements validate constraint supporter_acknowledgements_publication_check;

create policy consent_records_read_event_staff
on public.consent_records for select to authenticated
using (event_id is not null and public.has_active_event_role(event_id, array['host','cohost']));

create policy consent_records_create_event_staff
on public.consent_records for insert to authenticated
with check (
  event_id is not null
  and public.has_active_event_role(event_id, array['host','cohost'])
  and purpose = 'supporter_public_recognition'
  and granted is true
  and revoked_at is null
  and nullif(btrim(subject_display_name), '') is not null
);

create or replace function public.validate_supporter_prompt_link()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  linked_ack public.supporter_acknowledgements%rowtype;
  linked_consent public.consent_records%rowtype;
begin
  if new.prompt_type <> 'supporter_acknowledgement' then
    return new;
  end if;

  select * into linked_ack
  from public.supporter_acknowledgements
  where id = new.supporter_acknowledgement_id;

  if not found or linked_ack.event_id <> new.event_id then
    raise exception 'Supporter prompt must link to an acknowledgement for the same event.';
  end if;

  if linked_ack.display_permission is not true or linked_ack.moderation_status <> 'approved' then
    raise exception 'Supporter acknowledgement is not approved for public display.';
  end if;

  select * into linked_consent
  from public.consent_records
  where id = linked_ack.consent_record_id;

  if not found
    or linked_consent.event_id <> new.event_id
    or linked_consent.purpose <> 'supporter_public_recognition'
    or linked_consent.granted is not true
    or linked_consent.revoked_at is not null
    or btrim(linked_consent.subject_display_name) <> btrim(linked_ack.display_name)
  then
    raise exception 'Supporter acknowledgement lacks matching active display consent.';
  end if;

  if coalesce(new.content ->> 'message', '') <> coalesce(linked_ack.approved_message, '') then
    raise exception 'Supporter prompt copy must match the approved acknowledgement exactly.';
  end if;

  return new;
end;
$$;

create trigger display_prompts_validate_supporter_link
before insert or update on public.display_prompts
for each row execute function public.validate_supporter_prompt_link();

create or replace function public.create_supporter_display_prompt(
  target_event_id uuid,
  supporter_display_name text,
  approved_public_message text,
  consent_source text,
  consent_evidence jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  consent_id uuid;
  acknowledgement_id uuid;
  prompt_id uuid;
begin
  if not public.has_active_event_role(target_event_id, array['host','cohost']) then
    raise exception 'Active event host role required.';
  end if;
  if nullif(btrim(supporter_display_name), '') is null then
    raise exception 'Supporter display name is required.';
  end if;
  if nullif(btrim(approved_public_message), '') is null then
    raise exception 'Approved public message is required.';
  end if;
  if nullif(btrim(consent_source), '') is null then
    raise exception 'Consent capture source is required.';
  end if;

  insert into public.consent_records (
    event_id, subject_display_name, purpose, policy_version, granted, source, evidence
  ) values (
    target_event_id, btrim(supporter_display_name), 'supporter_public_recognition',
    'supporter-display-v1', true, btrim(consent_source), consent_evidence
  ) returning id into consent_id;

  insert into public.supporter_acknowledgements (
    event_id, display_name, approved_message, display_permission,
    moderation_status, consent_record_id
  ) values (
    target_event_id, btrim(supporter_display_name), approved_public_message,
    true, 'approved', consent_id
  ) returning id into acknowledgement_id;

  insert into public.display_prompts (
    event_id, prompt_type, region, content, status, created_by,
    supporter_acknowledgement_id
  ) values (
    target_event_id, 'supporter_acknowledgement', 'right_rail',
    jsonb_build_object('message', approved_public_message), 'draft', auth.uid(),
    acknowledgement_id
  ) returning id into prompt_id;

  return prompt_id;
end;
$$;

revoke all on function public.create_supporter_display_prompt(uuid,text,text,text,jsonb) from public;
grant execute on function public.create_supporter_display_prompt(uuid,text,text,text,jsonb) to authenticated;

revoke all on public.consent_records from anon;

comment on function public.create_supporter_display_prompt(uuid,text,text,text,jsonb) is
  'Atomically captures accountless supporter display consent, records the approved acknowledgement, and creates its linked draft prompt.';

commit;
