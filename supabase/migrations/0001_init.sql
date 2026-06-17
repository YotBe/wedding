-- 0001_init.sql — core schema for the wedding site.
--
-- Security model (see CLAUDE.md):
--   * RLS is ENABLED on every table here so nothing is readable by the anon
--     role through the Data API. No policies are added yet, so the effect is
--     deny-all until 0003_rls.sql grants the couple (admins) access.
--   * Guest-facing access happens only through SECURITY DEFINER RPCs added in
--     0002_rpc.sql (get_invite / submit_rsvp / find_table). Those bypass RLS.
--
-- gen_random_uuid() is available by default on Supabase (pgcrypto).

create table guests (
  id           uuid primary key default gen_random_uuid(),
  full_name    text not null,
  phone        text,                          -- E.164; used for lookup/sending
  invite_token text unique not null,          -- used in /rsvp/:token
  party_label  text,                          -- e.g. "Cohen family"
  max_party    int  not null default 1,       -- seats this invite covers
  side         text,                          -- 'bride' | 'groom' | 'both'
  language     text not null default 'he',    -- 'he' | 'en'
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

-- Helpful indexes for the lookups the app actually performs.
create index guests_phone_idx on guests (phone);
create index seat_assignments_table_id_idx on seat_assignments (table_id);
create index tables_name_idx on tables (name);

-- Lock everything down. Policies for admins come in 0003_rls.sql; until then
-- (and for anon forever) these tables are unreadable except via RPCs.
alter table guests           enable row level security;
alter table rsvps            enable row level security;
alter table tables           enable row level security;
alter table seat_assignments enable row level security;
alter table admins           enable row level security;
