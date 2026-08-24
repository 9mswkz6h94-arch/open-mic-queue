begin;

drop view if exists public.public_active_display_prompts;

drop policy if exists audit_events_read_event_host on public.audit_events;
drop policy if exists production_cues_read_event_staff on public.production_cues;
drop policy if exists supporter_acknowledgements_update_event_staff on public.supporter_acknowledgements;
drop policy if exists supporter_acknowledgements_create_event_staff on public.supporter_acknowledgements;
drop policy if exists supporter_acknowledgements_read_event_staff on public.supporter_acknowledgements;
drop policy if exists display_prompts_update_event_staff on public.display_prompts;
drop policy if exists display_prompts_create_event_staff on public.display_prompts;
drop policy if exists display_prompts_read_event_staff on public.display_prompts;
drop policy if exists event_roles_update_by_host on public.event_roles;
drop policy if exists event_roles_manage_by_host on public.event_roles;
drop policy if exists event_roles_read_assigned_event on public.event_roles;

drop trigger if exists display_prompts_log_transition on public.display_prompts;
drop trigger if exists display_prompts_validate_transition on public.display_prompts;
drop function if exists public.log_display_prompt_transition();
drop function if exists public.validate_display_prompt_transition();

alter table public.supporter_acknowledgements
  drop constraint if exists supporter_acknowledgements_publication_check;

revoke execute on function public.has_active_event_role(uuid, text[]) from authenticated;
drop function if exists public.has_active_event_role(uuid, text[]);

commit;
