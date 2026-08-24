\set ON_ERROR_STOP on

do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='consent_records' and column_name='subject_display_name') then
    raise exception 'accountless consent subject column missing';
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='supporter_acknowledgements' and column_name='consent_record_id') then
    raise exception 'acknowledgement consent link missing';
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='display_prompts' and column_name='supporter_acknowledgement_id') then
    raise exception 'prompt acknowledgement link missing';
  end if;
  if not exists (select 1 from pg_trigger where tgname='display_prompts_validate_supporter_link' and not tgisinternal) then
    raise exception 'supporter link validator missing';
  end if;
  if not exists (select 1 from pg_proc where proname='create_supporter_display_prompt') then
    raise exception 'atomic supporter prompt function missing';
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and policyname='consent_records_read_event_staff') then
    raise exception 'consent read policy missing';
  end if;
  if exists (
    select 1 from information_schema.role_table_grants
    where table_schema='public' and table_name='consent_records' and grantee='anon'
  ) then raise exception 'anon has direct consent-record access'; end if;
end;
$$;

select 'supporter consent link structure verified' result;
