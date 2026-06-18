-- 0003_rls.sql — admin access policies.
--
-- RLS is already ENABLED on every table (0001_init.sql) with no policies, so
-- the effect so far is deny-all for everyone via the Data API; guests reach
-- their own data only through the SECURITY DEFINER RPCs (0002_rpc.sql).
--
-- This migration grants the couple (authenticated users whose email is in the
-- `admins` allowlist) full direct access to every table. Anon still gets
-- nothing directly. Bootstrap the first admin manually, e.g.:
--   insert into admins (email) values ('you@example.com');

-- Helper: is the current authenticated user an admin? SECURITY DEFINER so it
-- can read `admins` regardless of that table's own policies, avoiding policy
-- recursion. search_path pinned.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.admins a
    where a.email = (auth.jwt() ->> 'email')
  );
$$;

revoke all on function public.is_admin() from public;
revoke execute on function public.is_admin() from anon;
grant execute on function public.is_admin() to authenticated;

-- Admin-only policies. One "for all" policy per table, gated by is_admin().
create policy admin_all_guests on public.guests
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy admin_all_rsvps on public.rsvps
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy admin_all_tables on public.tables
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy admin_all_seat_assignments on public.seat_assignments
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Admins can view/manage the allowlist itself.
create policy admin_all_admins on public.admins
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
