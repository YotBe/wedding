# CLAUDE.md — Wedding Site

> Drop this at the repo root. Claude Code reads it at the start of every session.
> Fill in the `[bracketed]` placeholders before you start.

## Project

Bilingual (Hebrew default / English), fully RTL wedding website for **[Bride] & [Groom]**.
Wedding date: **18 September 2026**. Venue: **[venue name + city]**.

It does three jobs:
1. **Public invitation** — event details, story, schedule, directions, gift info, photos.
2. **Guest RSVP** — each guest gets a personal link, confirms attendance + headcount + dietary needs + a blessing. No guest login.
3. **Admin dashboard** (the couple only) — guest list, RSVP tracking, and table assignment. Guests can then look up "which table am I at?".

## Stack

- Vite + React + TypeScript
- Tailwind CSS (with `rtl:`/`ltr:` variants and logical-property utilities)
- react-router
- react-i18next (`he` default, `en` secondary)
- Supabase — Postgres, Auth, Storage, Row-Level Security, RPC functions
- Vercel hosting + custom domain

## Hard rules (do not violate)

- **Hebrew is default and the whole UI must work RTL.** Toggle `dir` on `<html>` by language. Use logical spacing/positioning (`ps/pe`, `ms/me`, `start/end`) and `rtl:`/`ltr:` variants for anything directional. Never hardcode `left`/`right` or `ml-`/`mr-` for layout that should flip.
- **Every user-facing string goes through i18n** (`src/i18n/he.json` and `en.json`). No literal UI text inside components.
- **Guests never authenticate.** Guest access is a unique token link: `/rsvp/:token`. Table lookup is public via name search.
- **Anon clients never read tables directly.** All guest-facing reads/writes go through Supabase `SECURITY DEFINER` RPCs (`get_invite`, `submit_rsvp`, `find_table`). Direct table access is allowed for authenticated admins only, enforced by RLS. The guest list must never be exposed to anon.
- **Admin = the couple only.** Supabase Auth + an `admins` allowlist table. Guard all `/admin/*` routes behind an auth check.
- **Client secrets:** only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are exposed to the browser. The service-role key is never used client-side.
- **Mobile-first.** Almost every guest opens this on a phone from a WhatsApp link.

## Data model (Postgres)

```sql
create table guests (
  id           uuid primary key default gen_random_uuid(),
  full_name    text not null,
  phone        text,                          -- E.164; used for lookup/sending
  invite_token text unique not null,          -- used in /rsvp/:token
  party_label  text,                          -- e.g. "Cohen family"
  max_party    int  not null default 1,       -- seats this invite covers
  side         text,                           -- 'bride' | 'groom' | 'both'
  language     text not null default 'he',     -- 'he' | 'en'
  created_at   timestamptz not null default now()
);

create table rsvps (
  id           uuid primary key default gen_random_uuid(),
  guest_id     uuid not null unique references guests(id) on delete cascade,
  attending    boolean not null,
  num_adults   int not null default 0,
  num_kids     int not null default 0,
  dietary      text,                           -- 'none'|'vegetarian'|'vegan'|'other' + free text
  blessing     text,                           -- message to the couple
  responded_at timestamptz not null default now()
);

create table tables (                          -- seating tables
  id        uuid primary key default gen_random_uuid(),
  name      text not null,                     -- "שולחן 12" / "Table 12"
  capacity  int  not null,
  zone      text,                              -- optional area
  notes     text
);

create table seat_assignments (
  id         uuid primary key default gen_random_uuid(),
  guest_id   uuid not null unique references guests(id) on delete cascade,
  table_id   uuid not null references tables(id) on delete restrict,
  seats      int not null default 1,           -- seats this party takes at the table
  created_at timestamptz not null default now()
);

create table admins (
  email text primary key
);
```

## RLS / RPC summary

- RLS **enabled on every table**. Policy: authenticated users whose email is in `admins` get full access; anon gets nothing direct.
- Guest-facing access only through `SECURITY DEFINER` RPCs:
  - `get_invite(p_token text)` → guest's invite + existing rsvp + assigned table name (if any). Lookup by token only.
  - `submit_rsvp(p_token text, p_attending bool, p_adults int, p_kids int, p_dietary text, p_blessing text)` → upserts the rsvp for that token's guest.
  - `find_table(p_name text)` → returns only the table name + zone for an exact name match; never returns the guest list or other rows.

## Project structure

```
src/
  main.tsx
  App.tsx                  # router + dir/lang provider
  i18n/{index.ts, he.json, en.json}
  lib/supabase.ts          # anon client
  components/
  pages/
    Home.tsx               # public invitation
    Rsvp.tsx               # /rsvp/:token
    FindTable.tsx          # guest table lookup
    admin/{Login,Dashboard,Guests,Seating}.tsx
  hooks/
  types/
supabase/migrations/{0001_init.sql, 0002_rpc.sql, 0003_rls.sql}
```

## Commands

- `npm run dev` — local dev
- `npm run build` / `npm run preview`
- `supabase db push` — apply migrations (after `supabase link`)
- Deploy: push to `main`; Vercel builds automatically. Env vars set in Vercel project settings.

## Definition of done (every feature)

- Works in Hebrew (RTL) **and** English (LTR), strings via i18n.
- Works on mobile and desktop, no console errors.
- RLS verified: an anon client cannot read `guests`, `rsvps`, `tables`, or `seat_assignments` directly.
