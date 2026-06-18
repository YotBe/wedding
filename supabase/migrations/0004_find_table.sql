-- 0004_find_table.sql — public "find my table" lookup.
--
-- find_table(p_name): given a guest's name, return ONLY their assigned table's
-- name + zone. Never returns the guest list or any other guest's details.
-- Matching is case-insensitive and trimmed. To avoid leaking information when
-- a name is ambiguous, it returns null unless exactly one seated guest matches
-- (no match, an unseated guest, or multiple namesakes all yield null, and the
-- UI shows a generic "ask us" prompt).

create or replace function public.find_table(p_name text)
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  with matches as (
    select t.name, t.zone
    from public.guests g
    join public.seat_assignments sa on sa.guest_id = g.id
    join public.tables t            on t.id = sa.table_id
    where lower(btrim(g.full_name)) = lower(btrim(p_name))
  )
  select case
    when count(*) = 1 then jsonb_build_object('name', max(name), 'zone', max(zone))
    else null
  end
  from matches;
$$;

revoke all on function public.find_table(text) from public;
grant execute on function public.find_table(text) to anon, authenticated;
