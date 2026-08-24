begin;

drop function if exists public.create_supporter_display_prompt(uuid,text,text,text,jsonb);
drop trigger if exists display_prompts_validate_supporter_link on public.display_prompts;
drop function if exists public.validate_supporter_prompt_link();
drop policy if exists consent_records_create_event_staff on public.consent_records;
drop policy if exists consent_records_read_event_staff on public.consent_records;

alter table public.display_prompts drop constraint if exists display_prompts_supporter_link_check;
alter table public.display_prompts drop column if exists supporter_acknowledgement_id;

alter table public.supporter_acknowledgements
  drop constraint if exists supporter_acknowledgements_publication_check;
alter table public.supporter_acknowledgements
  add constraint supporter_acknowledgements_publication_check
  check (published_at is null or (display_permission is true and moderation_status = 'approved'));
alter table public.supporter_acknowledgements drop column if exists consent_record_id;

alter table public.consent_records drop constraint if exists consent_records_subject_check;
alter table public.consent_records
  add constraint consent_records_check
  check (profile_id is not null or artist_id is not null or entry_id is not null);
alter table public.consent_records drop column if exists subject_display_name;

commit;
