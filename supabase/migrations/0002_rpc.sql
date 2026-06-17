-- 0002_rpc.sql — guest-facing RPCs.
--
-- These are the ONLY way the anon client touches guest data. They run as
-- SECURITY DEFINER (owner privileges) so they bypass RLS, but each one looks
-- a guest up strictly by their unique invite token (or, in find_table, by an
-- exact table-name match) and returns only that single guest's own data — the
-- guest list is never exposed. See CLAUDE.md for the security model.
--
-- search_path is pinned so a SECURITY DEFINER function can't be hijacked by a
-- caller-controlled search_path.

-- get_invite(p_token): the guest's own invite, their existing rsvp (if any),
-- and their assigned table name/zone (if seated). Lookup by token only.
create or replace function public.get_invite(p_token text)
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  select case
    when g.id is null then null
    else jsonb_build_object(
      'guest', jsonb_build_object(
        'full_name',   g.full_name,
        'party_label', g.party_label,
        'max_party',   g.max_party,
        'language',    g.language
      ),
      'rsvp', case when r.id is null then null else jsonb_build_object(
        'attending',    r.attending,
        'num_adults',   r.num_adults,
        'num_kids',     r.num_kids,
        'dietary',      r.dietary,
        'blessing',     r.blessing,
        'responded_at', r.responded_at
      ) end,
      'table', case when t.id is null then null else jsonb_build_object(
        'name', t.name,
        'zone', t.zone
      ) end
    )
  end
  from (select p_token as token) q
  left join guests g            on g.invite_token = q.token
  left join rsvps r             on r.guest_id = g.id
  left join seat_assignments sa on sa.guest_id = g.id
  left join tables t            on t.id = sa.table_id;
$$;

-- submit_rsvp(...): upsert the rsvp for the guest owning p_token.
-- Returns the stored rsvp as jsonb. Raises if the token is unknown.
create or replace function public.submit_rsvp(
  p_token     text,
  p_attending boolean,
  p_adults    int,
  p_kids      int,
  p_dietary   text,
  p_blessing  text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_guest_id   uuid;
  v_max_party  int;
  v_adults     int;
  v_kids       int;
  v_rsvp       rsvps;
begin
  select id, max_party into v_guest_id, v_max_party
  from guests
  where invite_token = p_token;

  if v_guest_id is null then
    raise exception 'invalid_token' using errcode = 'no_data_found';
  end if;

  -- Normalise counts. A decline zeroes the headcount; otherwise clamp to a
  -- sane, non-negative range that can't exceed the seats the invite covers.
  if not p_attending then
    v_adults := 0;
    v_kids   := 0;
  else
    v_adults := greatest(coalesce(p_adults, 0), 0);
    v_kids   := greatest(coalesce(p_kids, 0), 0);
    if v_adults + v_kids > v_max_party then
      raise exception 'party_too_large' using errcode = 'check_violation';
    end if;
  end if;

  insert into rsvps (guest_id, attending, num_adults, num_kids, dietary, blessing, responded_at)
  values (v_guest_id, p_attending, v_adults, v_kids, nullif(p_dietary, ''), nullif(p_blessing, ''), now())
  on conflict (guest_id) do update
    set attending    = excluded.attending,
        num_adults   = excluded.num_adults,
        num_kids     = excluded.num_kids,
        dietary      = excluded.dietary,
        blessing     = excluded.blessing,
        responded_at = now()
  returning * into v_rsvp;

  return jsonb_build_object(
    'attending',    v_rsvp.attending,
    'num_adults',   v_rsvp.num_adults,
    'num_kids',     v_rsvp.num_kids,
    'dietary',      v_rsvp.dietary,
    'blessing',     v_rsvp.blessing,
    'responded_at', v_rsvp.responded_at
  );
end;
$$;

-- Lock down, then grant only the guest-facing surface to anon + authenticated.
revoke all on function public.get_invite(text) from public;
revoke all on function public.submit_rsvp(text, boolean, int, int, text, text) from public;

grant execute on function public.get_invite(text) to anon, authenticated;
grant execute on function public.submit_rsvp(text, boolean, int, int, text, text) to anon, authenticated;
