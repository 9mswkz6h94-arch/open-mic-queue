begin;
drop function if exists public.host_undo_show_transition(uuid,timestamptz,jsonb,jsonb,text);
drop function if exists public.host_apply_show_transition(uuid,text,timestamptz,uuid,uuid,uuid,uuid,integer,text,text,text,jsonb);
commit;
