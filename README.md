# Wedding Site

Bilingual (Hebrew default / English), fully RTL wedding website. Wedding: **18 September 2026**.

Conventions live in [`CLAUDE.md`](./CLAUDE.md); the phased build plan is in [`plan.md`](./plan.md).

## Stack

Vite + React + TypeScript · Tailwind CSS v4 · react-router · react-i18next (`he` default, `en` secondary) · Supabase · Vercel.

## Getting started

```bash
npm install
# Create a .env file in the project root (see Environment below), then:
npm run dev
```

## Environment

Create a `.env` file in the project root with the two browser-exposed variables:

```dotenv
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

Find both in the Supabase dashboard under **Project Settings → API**. The Supabase **service-role key is never used client-side**.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Local dev server |
| `npm run build` | Type-check (`tsc -b`) + production build |
| `npm run preview` | Serve the production build locally |
| `npm test` | Run unit tests (Vitest) |

## Database

Migrations live in [`supabase/migrations/`](./supabase/migrations). Apply them with the Supabase CLI:

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

RLS is enabled on every table; all guest-facing access goes through `SECURITY DEFINER` RPCs. The anon key can never read the guest list directly.

## Project structure

```
src/
  main.tsx            # entry — mounts <App>, loads i18n + styles
  App.tsx             # router + language/RTL provider
  i18n/               # i18next setup, he/en strings, LanguageProvider
  lib/supabase.ts     # anon Supabase client
  components/         # shared UI (LanguageToggle, …)
  pages/              # Home (public invite); Rsvp/FindTable/admin to come
  types/              # DB row types mirroring the schema
supabase/migrations/  # 0001_init.sql (schema + RLS); 0002_rpc, 0003_rls to come
```
