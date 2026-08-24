\set ON_ERROR_STOP on

do $$
begin
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='consent_records' and column_name='subject_display_name') then
    raise exception 'accountless consent subject column remains after rollback';
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='supporter_acknowledgements' and column_name='consent_record_id') then
    raise exception 'acknowledgement consent link remains after rollback';
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='display_prompts' and column_name='supporter_acknowledgement_id') then
    raise exception 'prompt acknowledgement link remains after rollback';
  end if;
  if exists (select 1 from pg_trigger where tgname='display_prompts_validate_supporter_link' and not tgisinternal) then
    raise exception 'supporter link validator remains after rollback';
  end if;
  if not exists (select 1 from pg_constraint where conname='supporter_acknowledgements_publication_check') then
    raise exception 'prior supporter publication constraint was not restored';
  end if;
  if (select count(*) from public.performers) <> 7 then
    raise exception 'performer baseline changed during supporter rollback';
  end if;
end;
$$;

select 'supporter consent link rollback verified' result;
