# Wedding Site — Build Plan

Bilingual (HE/EN, RTL) wedding site. Wedding: **18 Sep 2026**.
Stack: Vite + React + TS + Tailwind + Supabase + Vercel. Full conventions live in `CLAUDE.md`.

## How to use this plan with Claude Code

1. Put `CLAUDE.md` and this file at the repo root.
2. Work one phase at a time. Each phase below has a **Kickoff prompt** — paste it into Claude Code to start that phase.
3. Don't move on until the phase's **Done when** checks pass.

## Milestones

| Target date | Milestone |
|---|---|
| ~end of June | Phase 0–1 done: repo + Supabase + Vercel live, public invite page deployed |
| ~mid July | Phase 2 done: RSVP flow live and tested end to end |
| **~early August** | **Invites go out** — RSVP must be solid by here |
| ~late August | Phase 3 done: admin dashboard + guest list + RSVP tracking |
| ~early September | Phase 4 done: seating assigned, "find my table" works (finalize as RSVPs close) |
| ~10 September | Phase 5 done: polish, reminders, table lookup stress-tested |
| 18 September | 🎉 |

---

## Phase 0 — Setup & scaffolding

**Goal:** a deployed empty app with Supabase wired up, so everything after this is just building features.

Tasks:
- Scaffold Vite + React + TS + Tailwind + react-router.
- Set up react-i18next with `he` (default) + `en`, and an RTL-aware language provider that toggles `dir` on `<html>`.
- Create a Supabase project; add `0001_init.sql` (the schema from `CLAUDE.md`).
- Add `src/lib/supabase.ts` (anon client from env vars).
- Connect repo to Vercel; set `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`; confirm auto-deploy on push.
- Buy/point the custom domain.

**Done when:** the app deploys to your domain, language toggle flips HE/EN and RTL/LTR, and the DB has the four tables + `admins`.

**Kickoff prompt:**
> Read CLAUDE.md. Scaffold the project per the stack and structure there: Vite + React + TypeScript + Tailwind + react-router. Set up react-i18next with `he` as default and `en` secondary, plus a provider that sets `dir="rtl"`/`"ltr"` and `lang` on the document root when language changes. Create `src/lib/supabase.ts` using the anon client from `VITE_*` env vars. Create `supabase/migrations/0001_init.sql` with the exact data model from CLAUDE.md. Add a placeholder home page with a working language toggle. Don't build features yet.

---

## Phase 1 — Public invitation page

**Goal:** the shareable page. Build this first; it's the easy win you can send to family early.

Sections (all bilingual, mobile-first):
- Hero — names, date, venue, a hero photo.
- Our story — short text + a couple of photos.
- Schedule — reception / chuppah times.
- Getting there — map embed, parking, accessibility note.
- Gift — optional section with Bit / PayBox / bank-transfer details.
- A clear call-to-action button to RSVP (links to the personal link once you send them).

**Done when:** the page looks right in HE-RTL and EN-LTR on a phone, all text is in i18n files, images load fast.

**Kickoff prompt:**
> Read CLAUDE.md. Build the public invitation page (`pages/Home.tsx`) with these sections: hero (names/date/venue/photo), our story, schedule, getting-there (map + parking + accessibility), an optional gift section, and an RSVP call-to-action. Mobile-first, fully bilingual via i18n, fully RTL-correct in Hebrew. Use placeholder text/images I can swap. No backend calls needed on this page.

---

## Phase 2 — RSVP flow

**Goal:** a guest opens their personal link and responds. This is the core function.

Tasks:
- Add `0002_rpc.sql`: `get_invite(token)` and `submit_rsvp(...)` as `SECURITY DEFINER` functions (specs in CLAUDE.md).
- Build `/rsvp/:token`: fetch the invite via `get_invite`, show a form (attending yes/no, adults, kids, dietary, blessing), submit via `submit_rsvp`, show a confirmation screen. Pre-fill if they already responded so they can edit.
- Graceful states: invalid/expired token, already responded, "can't make it" path.

**Done when:** you can create a test guest with a token, open `/rsvp/<token>`, submit, and see the row in `rsvps`. Anon cannot read the `guests` table directly (verify).

**Kickoff prompt:**
> Read CLAUDE.md. Add `supabase/migrations/0002_rpc.sql` with `get_invite(p_token)` and `submit_rsvp(...)` as SECURITY DEFINER functions per the spec. Build `pages/Rsvp.tsx` for route `/rsvp/:token`: load the invite via `get_invite`, render a bilingual RSVP form (attending, num_adults, num_kids, dietary, blessing), submit via `submit_rsvp`, and show a confirmation. Handle invalid token, already-responded (pre-filled, editable), and declined cases. RTL-correct.

---

## Phase 3 — Admin dashboard

**Goal:** you two manage everything from one protected area.

Tasks:
- Add `0003_rls.sql`: enable RLS on all tables; admin-only policies keyed off the `admins` allowlist.
- Supabase Auth login at `/admin/login`; route guard on `/admin/*`.
- Guests: list, add/edit/delete, **CSV import** (full_name, phone, max_party, side, language), and auto-generate `invite_token` per guest.
- RSVP tracking: who responded, totals (adults/kids/declined/no-response), dietary tally, search/filter.
- Export guests + RSVPs to CSV.
- Generate the per-guest RSVP links + a copyable WhatsApp `wa.me` link with prefilled text, for sending.

**Done when:** you log in, import a guest list, see links generated, and watch test RSVPs show up in the tracker. Logged-out users can't reach `/admin`.

**Kickoff prompt:**
> Read CLAUDE.md. Add `supabase/migrations/0003_rls.sql` enabling RLS on all tables with admin-only policies based on the `admins` allowlist. Build Supabase email auth at `/admin/login` and guard `/admin/*`. Build the admin dashboard: guests CRUD with CSV import (auto-generate invite_token), an RSVP tracking view with totals and dietary tally and filters, CSV export, and a panel that produces each guest's `/rsvp/:token` link plus a prefilled `wa.me` share link. Bilingual UI is optional here (admin can be HE only) but keep it RTL-correct.

---

## Phase 4 — Seating

**Goal:** you assign tables; guests look themselves up.

Tasks:
- Admin seating tool: create/edit `tables` (name, capacity, zone); assign a guest's party to a table; show per-table fill vs capacity and an "unassigned guests" list. Drag-and-drop is nice but a dropdown-per-guest is fine for v1.
- Add `find_table(p_name)` RPC (returns only table name + zone for an exact match).
- Public `pages/FindTable.tsx`: guest types their name → sees their table. Handle no-match / multiple-match with a generic prompt.
- Show the assigned table on the guest's RSVP confirmation page too (via `get_invite`).

**Done when:** you can seat everyone with capacity warnings, and a guest can find their table by name without exposing anyone else's info.

**Kickoff prompt:**
> Read CLAUDE.md. Build the admin seating tool: manage `tables`, assign each guest's party to a table with capacity-vs-fill indicators and an unassigned list. Add the `find_table(p_name)` SECURITY DEFINER RPC (returns only the matching table's name + zone). Build public `pages/FindTable.tsx` with a name search using it, handling no/multiple matches generically. Also surface the assigned table on the RSVP confirmation via `get_invite`.

---

## Phase 5 — Polish & optional extras

Core polish:
- Reminder workflow: in admin, filter to non-responders and bulk-generate `wa.me` reminder links.
- Accessibility pass, performance (image sizing, lazy load), favicon/share preview (OG tags for nice WhatsApp link cards).
- Test `find_table` on real phones; a venue-entrance kiosk view is a plus.

Optional, only if you want them:
- Automated SMS via a provider (Twilio or an Israeli SMS gateway) instead of manual sending.
- Post-event photo upload/gallery (Supabase Storage).
- Save-the-date / countdown.

---

## Sending invites (no automation needed for v1)

Each guest has `/rsvp/<token>`. From the admin panel, export or copy the prefilled `wa.me` links and send via WhatsApp. Add automated SMS later only if manual sending gets tedious.

## Things to fill in before you start

- Couple names, exact venue + address, schedule times.
- Gift details (Bit/PayBox/bank), if you want that section.
- Whether table lookup should be name-only (default) or require the personal link.
