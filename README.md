# EcoReport

Citizens of Mysuru report environmental problems (air and water pollution, illegal dumping, noise, deforestation), follow each complaint with a tracking ID, and see public statistics. Authorities manage complaints from an admin area.

Built with Next.js 16 (App Router), React 19, Tailwind CSS 4, Supabase (Postgres, Auth, Storage), Recharts and Leaflet.

## Pages

| Route | Who | What it does |
|---|---|---|
| `/` | everyone | Intro and three live counters |
| `/report` | everyone | Complaint form (optional photo and location pin). Shows the tracking ID on success |
| `/track?id=ECO-2026-0001` | everyone | Status timeline and interventions for one complaint |
| `/dashboard` | everyone | Complaints by type and status, monthly trend, average time to resolve, top locations, map |
| `/admin/login` | admins | Email and password sign-in |
| `/admin` | admins | All complaints, filter by status and type |
| `/admin/ECO-2026-0001` | admins | Reporter details, status change, add interventions |

## How access works

- A public visitor cannot read or write any table directly. They only call three database functions: `submit_complaint`, `get_complaint_by_tracking_id` and `get_public_complaints`. None of them returns the reporter's name or contact.
- An admin is a signed-in user whose `app_metadata.role` is `admin`. Row Level Security lets only admins read all complaints, change status and add interventions.
- `src/proxy.ts` sends anyone who is not an admin away from `/admin/*`. Admin pages and Server Actions check the role again (`src/lib/auth.ts`), and the database enforces it a third time.
- Status changes are logged to `status_history` by a database trigger, which is what the timeline shows.

The schema, RLS policies, functions and storage bucket are all in `supabase/migrations/20261120000000_init_ecoreport.sql`.

## Setup

1. Install dependencies: `npm install`
2. Create a project at [supabase.com](https://supabase.com). Run `supabase/migrations/20261120000000_init_ecoreport.sql` in the SQL Editor. Optionally run `supabase/seed.sql` for 20 sample complaints around Mysuru.
3. Copy `.env.local.example` to `.env.local` and fill in the project URL and the public anon key (Project Settings, API). Never put the `service_role` key in this file.
4. Create an admin. In Supabase go to Authentication, Users, Add user (tick auto-confirm), then run this in the SQL Editor:

   ```sql
   update auth.users
   set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
   where email = 'admin@example.com';
   ```

   Use your own address. Sign in at `/admin/login` after this (an existing session needs a fresh sign-in to pick up the role).
5. Start the app: `npm run dev` and open http://localhost:3000.

## Scripts

- `npm run dev`: development server
- `npm run build` and `npm start`: production build and server
- `npm run lint`: ESLint
- `npm run check:stats`: checks the dashboard maths in `src/lib/stats.ts` (needs Node 22.18 or newer)

## Deploying

Deploy to any Node host, for example Vercel. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in the host's environment settings. In Supabase, add the deployed address under Authentication, URL Configuration.

## Known limits

This is a course prototype. The shortcuts that matter:

- No spam protection on the report form. Anyone with the public key can call `submit_complaint`, so add rate limiting or a CAPTCHA before real use.
- The location is pinned with the browser's "current location" button, not by clicking on a map.
- Photo uploads are limited to 5 MB JPG, PNG or WebP by the storage bucket. The complaint stores whatever `http(s)` photo URL it is given.
- Tracking IDs come from one global counter, so the number does not restart each year.
- The dashboard reads at most the newest 5000 complaints and totals them in the app. The admin table shows the newest 500 with no paging.
