# EcoReport: assignment requirements check

**Assignment:** Create a prototype for reporting environmental complaints and tracking response status.
**Inputs:** complaint type, location, date, response status, intervention data.
**Tools:** basic web app, database. **Output:** complaint/response prototype.

Checked on 21 Nov 2026 against commit `27e0249` (UI redesign) with the live Supabase project.
Evidence types: file and line, database column, live API test (as an anonymous visitor), or browser observation.

Status key: **PASS** = met and verified. **PASS\*** = met; verified in code and with live data, but the
admin write step still has to be run live (needs an admin sign-in, see #8). **PARTIAL** = some of it is
missing or not yet verified. **FAIL** = not met.

## Results

| # | Requirement | Status | Evidence | Fix needed |
|---|---|---|---|---|
| A1 | **Complaint type** stored, selectable on /report, shown in admin table, /track and dashboard | PASS | DB enum `complaint_type_enum` (6 values) and column `complaints.complaint_type`: `supabase/migrations/20261120000000_init_ecoreport.sql:16-19, 35`. Report tiles: `src/app/report/report-form.tsx:340-347`. Admin table: `src/app/admin/complaint-table.tsx:75` and table column. Track: `src/app/track/page.tsx:157`. Dashboard "By type" chart: `src/app/dashboard/charts.tsx:93`. Browser: test complaint ECO-2026-0022 (type Other) showed on /track and raised the dashboard "Other" bar from 2 to 3. | None |
| A2 | **Location**: text + optional coordinates captured, stored, shown on /track, admin pages and dashboard map | PASS | Columns `location_text` (3-300 chars), `latitude`, `longitude` with range checks and a both-or-neither constraint: migration `:37-39, 48`. Capture: `report-form.tsx:135` (device location) and `:203` (sent to `submit_complaint`). Live: ECO-2026-0022 stored `lat 12.3105, lng 76.642`. Shown: /track `page.tsx:158` (text), admin list and detail (`[trackingId]/page.tsx:131` "Open in map" link), dashboard map pins `complaint-map.tsx:48` (22 pins after the test, including the test pin). | None required. Note: /track shows the place as text only, not on a map. Coordinates can only come from the device's "current location", not from picking a point on a map. |
| A3 | **Date** captured, no future dates, shown where relevant | PARTIAL | Complaint date: column `complaint_date` (default today) `:40`. Client check `report-form.tsx:50-51` and `max` `:442`. Browser: a date 2 days ahead was blocked with "The date can't be in the future." Server check in `submit_complaint` `:187-189`. Live API test returned `22023 Complaint date cannot be in the future`, and no row was created. Shown on /track, admin list, admin detail and map popups. **Gap:** intervention date (`interventions.intervention_date` `:56`) is only limited by the browser `max` attribute (`[trackingId]/forms.tsx:142`). Neither `addIntervention` (`src/app/admin/actions.ts:25-36`) nor the database rejects a future intervention date. | Add a "not in the future" check for the intervention date in `addIntervention` (small code change, no database change). |
| A4 | **Response status**: 5-step workflow, admin-only changes, visible on /track with timeline, logged in `status_history` with timestamps | PASS\* | Enum `submitted, under_review, action_taken, resolved, rejected` `:21-23`. Trigger `log_status_change` writes `status_history(old_status, new_status, changed_at)` on insert and on every change `:107-122`. Admin-only, at three levels: RLS update policy `is_admin()` `:145-146`, `requireAdmin()` in each action `actions.ts:19,26` and `src/lib/auth.ts:9`, and the route guard `src/proxy.ts:35`. Live: anonymous UPDATE on `complaints` was refused (HTTP 401, code 42501), and public sign-up is disabled (`/auth/v1/settings: disable_signup = true`). /track timeline: `track/page.tsx:185`. Browser: ECO-2026-0022 showed "Submitted · Current · 21 Nov 2026, 2:06 pm" plus the upcoming steps. | None for the requirement. Run the live admin status change (#8). Note: any status can follow any other (no enforced order), and a rejection has no reason field. |
| A5 | **Intervention data**: admin logs action, department, date, remarks; visible on /track and admin detail | PASS\* | Table `interventions(action_taken, department, intervention_date, remarks)` `:51-59`. Admin-only insert policy `:150-151`. Form fields `[trackingId]/forms.tsx:103, 119, 140, 156`. Server action `actions.ts:25-36`. Public read through `get_complaint_by_tracking_id` `:222-230` and shown at `track/page.tsx:205`. Admin detail `[trackingId]/page.tsx:189`. Browser: seeded interventions are visible on /track (e.g. ECO-2026-0003, ECO-2026-0015). Live: anonymous INSERT into `interventions` was refused (42501). | Run the live admin "Record action" step (#8). |
| B6 | **Basic web app**: report, track, admin, dashboard load and work on mobile and desktop | PARTIAL | Browser at 390, 768 and 1280 px: `/`, `/report` (all 3 steps and the success screen), `/track` (result, not found, empty), `/dashboard`, `/admin/login` and the 404 page load with no horizontal scrolling. Production build lists all routes. **Not yet checked in the browser:** `/admin` and `/admin/[trackingId]`, because they need an admin session. | Sign in as admin so these two pages can be checked at 3 widths. |
| B7 | **Database**: schema, constraints, RLS; anon cannot read private data or modify records; only admins update status/add interventions | PASS | 3 tables with CHECK constraints and foreign keys `ON DELETE CASCADE` `:32-67`. RLS enabled on all three `:138-140`. Anon privileges revoked `:157`. Live anonymous tests: SELECT on `complaints` (including only `reporter_name, reporter_contact`), `interventions` and `status_history`, plus UPDATE, DELETE and INSERT attempts: **all refused (HTTP 401, 42501)**. Public RPC output fields: `tracking_id, complaint_type, location_text, latitude, longitude, complaint_date, status, created_at, resolved_at`, with **no `reporter_*` fields**. Sign-up disabled, so no non-admin accounts can be created. | None required. Optional hardening (database change, needs approval): also `revoke all ... from authenticated` before the explicit grants. RLS already blocks those operations. |
| C8 | **End-to-end flow**: submit, tracking ID, look up, admin updates status + adds intervention, citizen sees it, dashboard updates | PARTIAL | Done live in the browser: submitted test complaint **ECO-2026-0022**, received the ID on the success screen, looked it up on /track (status Submitted, type, place, date, timeline). Dashboard went from 21 to 22 total, Submitted 4 to 5, Other 2 to 3, Nov from 5 to 6. **Not yet done:** admin status change and intervention for ECO-2026-0022, and the citizen view and dashboard after those, because there was no admin session. | Sign in as admin, then run the admin half. Delete ECO-2026-0022 afterwards. |
| C9 | **Dashboard analytics**: counts by type and status, trend, average resolution time, map; numbers add up | PASS | Stat cards `dashboard/page.tsx:76-95`, charts `charts.tsx:88-99`, average `src/lib/stats.ts:39-41`, map `page.tsx:129`. Independent recount from the database (`get_public_complaints`, not using the app's code): 21 total, 7 resolved, 12 open; status 4/3/5/7/2; type air 5, water 4, dumping 4, noise 4, deforestation 2, other 2; months Aug 2, Sep 8, Oct 6, Nov 5; average resolution 13.00 days over 7 resolved. These match the page exactly. After the test complaint both showed 22. `npm run check:stats` passes. | None. Note: "time to resolve" runs from submission to the latest change to Resolved. Rejected complaints are not counted. |
| D10 | **Lint, typecheck, build** | PASS | `eslint .` exit 0, `tsc --noEmit` exit 0, `next build` succeeded (10 routes), `npm run check:stats` printed "stats ok" (with a harmless Node "module type" warning). | None |
| D11 | **README**: setup, features, schema, user/admin flows | PARTIAL | `README.md` has pages, access model, setup, scripts, deploying and known limits. **Gaps:** step 3 says to copy `.env.local.example`, but that file does not exist and `.gitignore:34` (`.env*`) would block committing it. There is no description of the tables, columns and enums (it only points to the SQL file). There is no step-by-step citizen or admin flow. The new UI features (3-step form, timeline, filters) are not described. | Add `.env.local.example` (with placeholders) and `!.env.local.example` in `.gitignore`, or change the instructions. Add "Database schema" and "How to use (citizen / admin)" sections. |
| D12 | **Sample data** realistic, covers every type and status | PASS | `supabase/seed.sql`: 20 complaints in real Mysuru localities with coordinates, fictional names, `example.com` emails and `+91 90000 0000x` phones. All 6 types (air 4, water 4, dumping 4, noise 4, deforestation 2, other 2) and all 5 statuses (submitted 3, under review 3, action taken 5, resolved 7, rejected 2). A matching status history, and 14 interventions on 12 complaints. | None required. Notes: no sample photos, and the rejected samples have no recorded reason. The live database also holds **ECO-2026-0021** (Submitted, Air pollution, "Devaraja Market, Mysuru"), which is not in the seed. Check whether it is an old test entry. |
| D13 | **Security**: no keys committed, .env ignored, no service_role key in the app | PASS | `git ls-files` has no env files. `git log --all` never contained an env file. A history scan for JWT, `sb_secret_` and `sb_publishable_` patterns found only a `package-lock.json` integrity hash (false positive). `.env.local` is ignored (`.gitignore:35`). `service_role` appears only in a README warning. The app reads only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (`src/lib/supabase/client.ts:7-8`, `server.ts:10-11`, `src/proxy.ts:11-12`). The key in `.env.local` is a publishable key. | None. Notes: anyone can upload images to the photo bucket (`:293-295`), and there is no rate limit on reports. |
| D14 | **Known limitations** listed honestly | PASS | See the list below (README also has a "Known limits" section). | Copy the list below into the report. |

### Test data written during this check
- **One** complaint: **ECO-2026-0022** ("TEST COMPLAINT created by the automated requirements check…",
  reporter "TEST Verification"). The database added its first status-history row automatically.
- Nothing else was written. All other write attempts were made as an anonymous visitor against IDs that
  do not exist, and were refused.
- To delete it (Supabase SQL Editor; interventions and history are removed by `ON DELETE CASCADE`):
  `delete from public.complaints where tracking_id = 'ECO-2026-0022';`

## Recommended fixes (not applied yet), most important first

1. **Finish the live admin checks (no code change):** sign in as admin, change the status of ECO-2026-0022,
   record an intervention, confirm /track and the dashboard update, and check `/admin` and
   `/admin/[trackingId]` at 390, 768 and 1280 px. This closes A4, A5, B6 and C8.
2. **README fixes:** working env setup (`.env.local.example` plus a `.gitignore` exception, or corrected
   steps), a "Database schema" section (3 tables, key columns, the 2 enums, RLS and the 3 RPCs), and a
   "How to use" section for the citizen and admin flows.
3. **Intervention date check:** reject a future `intervention_date` in `addIntervention` with a friendly
   message (closes A3, no database change).
4. **Rejection reason (UX):** when an admin picks "Rejected", ask them to record an intervention that
   explains why, so citizens are not left with a bare "Rejected".
5. **Optional:** a small map on /track when the complaint has coordinates.
6. **Optional hardening (database change, needs your approval):** revoke default `authenticated`
   privileges before the explicit grants, and limit or monitor photo uploads.
7. **Clean-up:** delete ECO-2026-0022 after review, and check whether ECO-2026-0021 is an old test entry.

## Known limitations and future scope (for the report)

- **No spam protection:** anyone can submit complaints and upload photos. No CAPTCHA, rate limit or
  verification of the reporter's phone or email.
- **Public complaint details:** tracking IDs are sequential and listed on the public dashboard, so anyone
  can open any complaint's description, place and photo. Reporter name and contact are never public, but
  reporters could type personal details into the description.
- **Location:** a pin comes only from the device's current location. There is no map picker, so you
  cannot pin a place you are not standing at.
- **Status workflow is not enforced:** an admin can move a complaint to any status, including backwards.
  There is no field for a rejection reason, and no record of which admin made a change.
- **One admin role:** no departments, case assignment, deadlines or escalation.
- **No notifications:** the reporter is not told by SMS or email when the status changes; they have to
  check with the tracking ID.
- **No duplicate detection:** the same problem reported twice shows up as two complaints (e.g. the two
  Bannimantap garbage-burning reports).
- **Scale shortcuts:** the dashboard totals at most 5000 complaints in the app, and the admin list shows
  the newest 500 with no paging.
- **Photos:** a complaint can store any http(s) photo URL sent to the database function, not only files
  from the app's own storage.
- **Dates:** the database accepts a complaint date up to one day ahead, to allow for time zones.
- **Testing:** only the dashboard maths has an automated check. There are no automated end-to-end tests.
- **Language and region:** English only (no Kannada), and set up for a single city (Mysuru).
