# EcoReport: assignment requirements check

**Assignment:** Create a prototype for reporting environmental complaints and tracking response status.
**Inputs:** complaint type, location, date, response status, intervention data.
**Tools:** basic web app, database. **Output:** complaint/response prototype.

First checked on 21 Nov 2026 at commit `27e0249`. Re-checked the same day after the approved fixes
(up to commit `e38fc78`), with the live Supabase project and an admin session.
Evidence types: file and line, database column, live API test (as an anonymous visitor), or browser observation.

Status key: **PASS** = met and verified. **PARTIAL** = some of it is missing or not verified. **FAIL** = not met.

## Results

| # | Requirement | Status | Evidence | Fix needed |
|---|---|---|---|---|
| A1 | **Complaint type** stored, selectable on /report, shown in admin table, /track and dashboard | PASS | DB enum `complaint_type_enum` (6 values) and column `complaints.complaint_type`: `supabase/migrations/20261120000000_init_ecoreport.sql:16-19, 35`. Report tiles: `src/app/report/report-form.tsx:340-347`. Admin list: `src/app/admin/complaint-table.tsx`. Track: `src/app/track/page.tsx:157`. Dashboard "By type" chart: `src/app/dashboard/charts.tsx:93`. Browser: test complaint ECO-2026-0022 (type Other) appeared in the admin list, on /track, and raised the dashboard "Other" bar from 2 to 3. | None |
| A2 | **Location**: text + optional coordinates captured, stored, shown on /track, admin pages and dashboard map | PASS | Columns `location_text` (3-300 chars), `latitude`, `longitude` with range checks and a both-or-neither constraint (migration `:37-39, 48`). Capture: `report-form.tsx:135` (device location), `:203` (sent to `submit_complaint`). Live: ECO-2026-0022 stored `lat 12.3105, lng 76.642`. Shown: /track (text), admin list, admin detail ("Open in map" link), dashboard map pin with status icon. | None required. Note: /track shows the place as text only (no map, by choice). |
| A3 | **Date** captured, no future dates, shown where relevant | PASS | **Complaint date:** column `complaint_date` (migration `:40`). Client check `report-form.tsx:50-51`, browser blocked a date 2 days ahead. Server check in `submit_complaint` `:187-189`; live call returned `22023 Complaint date cannot be in the future` and created no row. **Intervention date (fixed):** `addIntervention` in `src/app/admin/actions.ts` refuses a date after today (Indian time). Live: with the date picker's limit removed and 2030-01-01 entered, the page showed "The action date can't be in the future. Pick today or an earlier date." Nothing was saved and the typed text was kept. Dates are shown on /track, the admin list and detail, and map popups. | None |
| A4 | **Response status**: 5-step workflow, admin-only changes, visible on /track with timeline, logged in `status_history` with timestamps | PASS | Enum `submitted, under_review, action_taken, resolved, rejected` (migration `:21-23`). Trigger `log_status_change` writes `status_history(old_status, new_status, changed_at)` `:107-122`. Admin-only at 3 levels: RLS update policy `is_admin()` `:145-146`, `requireAdmin()` in every server action (`actions.ts`), and the route guard `src/proxy.ts:35`. Live anonymous UPDATE was refused (HTTP 401, 42501), and public sign-up is disabled. **Live admin test:** ECO-2026-0022 went Submitted (2:06 pm) to Under review (2:21 pm) to Rejected (2:22 pm). Each change showed a toast and appeared in the admin history, the citizen /track timeline and the dashboard. | None. Note: any status can follow any other (no enforced order). |
| A5 | **Intervention data**: admin logs action, department, date, remarks; visible on /track and admin detail | PASS | Table `interventions(action_taken, department, intervention_date, remarks)` (migration `:51-59`), admin-only insert policy `:150-151`, form `src/app/admin/[trackingId]/forms.tsx`, server action `addIntervention`. **Live admin test:** recorded "TEST action: site visit..." (Mysuru City Corporation, 21 Nov 2026, with a remark). It appeared on the admin page (count 0 to 1) and on the citizen /track page. **Rejection reason (new):** choosing Rejected requires a reason and a department, saved as the action "Complaint rejected. Reason: ...". Live: an empty reason was blocked; the filled reason appeared on /track, which also says "Their reason is listed under their actions below." | None |
| B6 | **Basic web app**: report, track, admin and dashboard load and work on mobile and desktop | PASS | Browser at 390, 768 and 1280 px, with no horizontal scrolling on any page: `/`, `/report` (all steps and the success screen), `/track`, `/dashboard`, `/admin/login`, `/admin` and `/admin/ECO-2026-0022`, plus the 404 page. **Admin UI problems found and fixed** (commit `e38fc78`): at 768 px the table hid the Status column (cards are now used up to 1024 px); at 390 px the status chips broke their text and scrolled sideways (they now wrap); the type filter now keeps Apply on the same row. | None |
| B7 | **Database**: schema, constraints, RLS; anon cannot read private data or modify records; only admins update status/add interventions | PASS | 3 tables with CHECK constraints and foreign keys `ON DELETE CASCADE` (migration `:32-67`). RLS on all three `:138-140`. Anon privileges revoked `:157`. Live anonymous tests: SELECT on `complaints` (including only the `reporter_*` columns), `interventions` and `status_history`, plus UPDATE, DELETE and INSERT attempts, were all refused (HTTP 401, 42501). The public RPCs return no `reporter_*` fields, and /track for the test complaint did not show the test reporter's name or email. Sign-up is disabled. | None (database hardening skipped by choice; RLS already blocks these operations). |
| C8 | **End-to-end flow**: submit, tracking ID, look up, admin updates status + adds intervention, citizen sees it, dashboard updates | PASS | Live, in the browser: submitted **ECO-2026-0022**, got the ID, looked it up (Submitted). As admin: changed the status to Under review, recorded an action, then rejected it with a reason. As a citizen, /track then showed Rejected, a 3-step timeline and 2 actions. Dashboard: 21 to 22 total after submitting, and after the admin changes Submitted 5 to 4 and Rejected 2 to 3. These match an independent recount from the database. | Delete ECO-2026-0022 (see below) |
| C9 | **Dashboard analytics**: counts by type and status, trend, average resolution time, map; numbers add up | PASS | Stat cards, charts, average (`src/lib/stats.ts:39-41`) and map. Independent recount from `get_public_complaints` (not using the app's code) matched the page exactly 3 times: 21 rows before the test, 22 after submitting, and 22 after the admin changes (status 4/3/5/7/3, type air 5, water 4, dumping 4, noise 4, other 3, deforestation 2, months Aug 2, Sep 8, Oct 6, Nov 6, average 13.0 days over 7 resolved). `npm run check:stats` passes. | None. Note: "time to resolve" runs from submission to the latest change to Resolved; rejected complaints are not counted. |
| D10 | **Lint, typecheck, build** | PASS | After every commit: `eslint` exit 0, `tsc --noEmit` exit 0, `next build` succeeded. `npm run check:stats` printed "stats ok" (with a harmless Node "module type" warning). | None |
| D11 | **README**: setup, features, schema, user/admin flows | PASS | `README.md` now has Features, Pages, **How to use** (citizen and admin step by step), How access works, **Database schema** (3 tables with columns, relationships, an ER diagram, enums, functions and triggers), Setup using `cp .env.local.example .env.local`, Scripts, Deploying and Known limits. `.env.local.example` is committed with placeholder values only, thanks to `!.env.local.example` in `.gitignore`. `git add --dry-run` confirmed `.env.local` is still ignored. | None |
| D12 | **Sample data** realistic, covers every type and status | PASS | `supabase/seed.sql`: 20 complaints in real Mysuru localities with coordinates and fictional reporters. All 6 types (air 4, water 4, dumping 4, noise 4, deforestation 2, other 2) and all 5 statuses (submitted 3, under review 3, action taken 5, resolved 7, rejected 2). A matching status history, and 14 interventions on 12 complaints. | None required. Notes: no sample photos, and the 2 seeded rejected complaints have no recorded reason (new rejections now always have one). |
| D13 | **Security**: no keys committed, .env ignored, no service_role key in the app | PASS | No env file was ever committed (`git log --all`). A history scan for JWT, `sb_secret_` and `sb_publishable_` patterns found only a `package-lock.json` integrity hash (false positive). `.env.local` is ignored; only `.env.local.example` (placeholders) is tracked. `service_role` appears only in README warnings. The app reads only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (`src/lib/supabase/client.ts`, `server.ts`, `src/proxy.ts`). | None. Notes: anyone can upload images to the photo bucket, and there is no rate limit on reports. |
| D14 | **Known limitations** listed honestly | PASS | See the list below, and "Known limits" in the README. | None |

## Fixes applied after the first check

| Fix | Commit |
|---|---|
| `.env.local.example` with placeholders, tracked through a `.gitignore` exception; `.env.local` still ignored | `67a2b7e` |
| Server-side check: no future intervention dates, with a friendly message; admin actions return friendly errors instead of raw database errors | `f76572c` |
| Rejecting a complaint requires a reason and a department, saved as an intervention the reporter can see | `f5a8ca2` |
| README: env setup, How to use, Database schema | `970b1b7` |
| Admin list layout at 768 px and 390 px (found during the admin check) | `e38fc78` |

Skipped by choice (prototype): a map on /track and database hardening.

## Test data written during this check

All of it belongs to **one** complaint, **ECO-2026-0022** ("TEST COMPLAINT created by the automated
requirements check…", reporter "TEST Verification"):
- the complaint itself, with 3 status history rows (Submitted, Under review, Rejected) written by the trigger;
- 2 interventions: "TEST action: site visit…" and "Complaint rejected. Reason: TEST rejection…".

Nothing else was written. Every other write attempt was made as an anonymous visitor against IDs that
do not exist and was refused, or was stopped by validation before saving.

To delete it, run this in the Supabase SQL Editor (its history and interventions go with it, through `ON DELETE CASCADE`):

```sql
delete from public.complaints where tracking_id = 'ECO-2026-0022';
```

The database also holds **ECO-2026-0021** (reporter "Test Reporter", Submitted, Air pollution,
"Devaraja Market, Mysuru"). It is not in the seed data and looks like an earlier test entry. If so,
delete it the same way.

## Known limitations and future scope (for the report)

- **No spam protection:** anyone can submit complaints and upload photos. There is no CAPTCHA, no rate
  limit and no check of the reporter's phone or email.
- **Public complaint details:** tracking IDs are sequential and listed on the public dashboard, so anyone
  can open any complaint's description, place and photo. Reporter name and contact are never public, but
  reporters could type personal details into the description.
- **Location:** a pin comes only from the device's current location. There is no map picker, so you
  cannot pin a place you are not standing at.
- **Status workflow is not enforced:** an admin can move a complaint to any status, including backwards.
  There is no record of which admin made a change.
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
- **Rejection reason:** saved as an intervention, not in its own column. The 2 seeded rejected
  complaints have no reason.
- **Testing:** only the dashboard maths has an automated check. There are no automated end-to-end tests.
- **Language and region:** English only (no Kannada), and set up for a single city (Mysuru).
