do $$
begin
  if to_regclass('public.public_active_display_prompts') is not null then
    raise exception 'public_active_display_prompts view still exists';
  end if;

  if to_regprocedure('public.has_active_event_role(uuid,text[])') is not null then
    raise exception 'has_active_event_role function still exists';
  end if;

  if exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and policyname like 'display_prompt_%'
  ) then
    raise exception 'display prompt policies still exist';
  end if;

  if exists (
    select 1
    from pg_trigger
    where tgname in ('validate_display_prompt_change', 'audit_display_prompt_change')
      and not tgisinternal
  ) then
    raise exception 'display prompt triggers still exist';
  end if;

  if exists (
    select 1
    from pg_constraint
    where conname = 'supporter_acknowledgements_publishable_check'
  ) then
    raise exception 'supporter publication constraint still exists';
  end if;

  if to_regclass('public.performers') is null
     or to_regclass('public.display_prompts') is null
     or to_regclass('public.audit_events') is null then
    raise exception 'foundation tables were disturbed by rollback';
  end if;
end
$$;

select
  (select count(*) from public.performers) as performers,
  (select count(*) from public.display_prompts) as display_prompts,
  (select count(*) from public.supporter_acknowledgements) as supporter_acknowledgements,
  (select count(*) from public.production_cues) as production_cues,
  (select count(*) from public.audit_events) as audit_events;

select 'display prompt permission rollback verified' as result;
