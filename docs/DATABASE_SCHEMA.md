# PMS database schema and departmental RLS

This document is the security contract for the Performance Management System.
**No application UI should ship until this schema and its RLS policies are reviewed and applied.**

The frontend is untrusted. Department silos are enforced in Postgres so a buggy
query, a leaked UUID, or a compromised browser session cannot read Marketing
rows while authenticated as Finance HR.

## Threat model

| Actor | May see |
|---|---|
| `anon` | Nothing in `public` |
| `employee` | Own performance records; department kudos feed; colleague **directory** (name/title only) |
| `manager` | Self + **direct reports in the same department**; department kudos; cannot see skip-levels or other teams |
| `hr` | All employees whose `department_id` is in `department_hr_assignments` for that user |
| `super_admin` | All departments; the only role that assigns HR to departments |

Fail closed: an `hr` user with **no** assignment rows sees **no** departmental employee data (except their own profile).

## Why `department_id` is denormalized

Child tables (`objectives`, `one_on_ones`, `kudos`, …) store `department_id`.
RLS predicates filter on that column (indexed) instead of joining `profiles` inside
policies. Joining `profiles` from a `profiles` policy causes infinite recursion.

A `BEFORE INSERT OR UPDATE` trigger copies `department_id` from the subject
employee and **rejects** any client-supplied value that does not match. Cross-department
writes are impossible even if the client tampers with the payload.

## Auth mapping

| App role (JWT user → `profiles.role`) | Example |
|---|---|
| `super_admin` | Platform HRIS admin |
| `hr` | HR_Finance after assignment to Finance |
| `manager` | Manager_Finance |
| `employee` | Employee_Finance |

`auth.uid()` = `profiles.id` = `auth.users.id`.

JWT custom claims are **not** used as the source of truth for department or role.
A user cannot escalate by editing local storage. Role and department live in
`profiles` / `department_hr_assignments` and are read by `SECURITY DEFINER`
helpers that bypass RLS (necessary) but return only data for `auth.uid()`.

## Tables

```
auth.users
    └── profiles (role, department_id, manager_id, hired_at)
            ├── department_hr_assignments (SuperAdmin → HR ↔ department)
            ├── employee_skills
            ├── objectives → key_results
            ├── one_on_ones → agenda_notes, action_items
            └── kudos (giver) / kudos (recipient)

departments
skill_catalog
```

### `departments`

Org silo key. Finance, Marketing, Logistics are separate rows.

### `profiles`

One row per authenticated user. Check: non-admins **must** have `department_id`.
`manager_id` must reference a user in the **same** department (enforced by trigger).

Sensitive columns (`role`, `department_id`, `manager_id`, `is_active`) cannot be
changed by the employee. HR may change `manager_id` and `is_active` **within
assigned departments**. Only `super_admin` may change `role` or move departments
(and only onto a department they are allowed to administer — all of them).

### `department_hr_assignments`

SuperAdmin assigns HR users to departments. This is the **only** grant that lets
an HR user read a silo.

### Performance data

| Table | Purpose |
|---|---|
| `objectives`, `key_results` | OKRs; `stalled` / stale `last_progress_at` feed Flight Risk |
| `one_on_ones` | Monthly 1-to-1 cycle (schedule, status) |
| `one_on_one_agenda_notes` | Shared agenda |
| `action_items` | Follow-ups from 1-to-1s |
| `kudos` | 360° recognition; `department_id` silo; feeds annual portfolio |
| `skill_catalog`, `employee_skills` | Skills Heatmap inputs |

## RLS helper functions (`SECURITY DEFINER`)

Defined in `public`, `SET search_path = public`, executable by `authenticated`:

- `is_super_admin()`
- `profile_department_id()` — caller's home department
- `is_hr_for_department(uuid)`
- `hr_assigned_department_ids()`
- `can_manage_profile(uuid)` — HR (assigned dept), manager (direct report, same dept), self, or super_admin
- `can_view_performance_of(uuid)` — same as manage for performance rows (managers: direct reports only)

These functions `SELECT` from `profiles` and `department_hr_assignments` **as the
owner**, so they must never accept a user-supplied id to return another user's
role without an explicit check.

## Policy matrix (performance tables)

Subject = `employee_id` (or giver/recipient for kudos).

| Operation | employee | manager | hr (assigned) | super_admin |
|---|---|---|---|---|
| SELECT own | yes | yes | yes | yes |
| SELECT report / dept | no | direct reports, same dept | entire assigned dept | all |
| INSERT | own | own + reports | assigned dept | all |
| UPDATE / DELETE | own (limited) | reports + own | assigned dept | all |

Kudos **SELECT** is wider: any authenticated user may read kudos whose
`department_id` equals their home department (continuous team board). HR also
reads assigned departments. Insert: giver must be `auth.uid()`, recipient must
be active in the **same** department, not self.

## Colleague directory (intentional exception)

Employees cannot `SELECT` other `profiles` rows (avoids leaking `manager_id`,
`hired_at`, role). Name/title lookup for the Kudos board uses
`colleague_directory`, a view that returns only `id, full_name, title, avatar_url, department_id`
for the caller's department (or HR assignments / all for super_admin).

## HR-only aggregates

These are `SECURITY DEFINER` functions that **return zero rows** unless the
caller is `super_admin` or `hr` assigned to that department:

- `hr_flight_risk_radar(p_department_id uuid)` — no completed 1-to-1 in 60 days (or never, if hired ≥ 60 days ago) **or** stalled/stale OKRs
- `hr_skills_heatmap(p_department_id uuid)` — average proficiency by skill
- `hr_dashboard_metrics(p_department_id uuid)` — counts for the departmental dashboard

Do not expose equivalent aggregates through invoker views that employees could call.

## Grants

- `REVOKE ALL` on `public` tables from `anon` and `PUBLIC`
- `GRANT` DML to `authenticated` only; RLS still filters rows
- `service_role` bypasses RLS (Supabase default). **Never** put `service_role` in the browser. Use it only for trusted server jobs.

## Bootstrap SuperAdmin

After the first user signs up (row in `auth.users` + `profiles` via trigger):

```sql
UPDATE public.profiles
SET role = 'super_admin', department_id = NULL
WHERE email = 'admin@example.com';
```

Then assign HR:

```sql
UPDATE public.profiles SET role = 'hr' WHERE email = 'hr.finance@example.com';

INSERT INTO public.department_hr_assignments (user_id, department_id, assigned_by)
SELECT p.id, d.id, (SELECT id FROM public.profiles WHERE role = 'super_admin' LIMIT 1)
FROM public.profiles p
CROSS JOIN public.departments d
WHERE p.email = 'hr.finance@example.com' AND d.slug = 'finance';
```

## Exact RLS policies (migration)

Defined in `supabase/migrations/20260828120000_pms_schema_and_rls.sql`.
Every table uses `ENABLE` + `FORCE ROW LEVEL SECURITY`. Policies target `TO authenticated` only.

| Table | Policy | Command | Predicate (summary) |
|---|---|---|---|
| departments | `departments_select` | SELECT | super_admin **or** home dept **or** HR assignment |
| departments | `departments_write_admin` | ALL | super_admin |
| profiles | `profiles_select_self` | SELECT | `id = auth.uid()` |
| profiles | `profiles_select_hr` | SELECT | `is_hr_for_department(department_id)` |
| profiles | `profiles_select_manager_reports` | SELECT | manager + `manager_id = auth.uid()` + same dept |
| profiles | `profiles_select_super_admin` | SELECT | super_admin |
| profiles | `profiles_update_manage` | UPDATE | `can_manage_profile(id)` + column trigger |
| department_hr_assignments | `hr_assignments_select` | SELECT | super_admin **or** own rows |
| department_hr_assignments | `hr_assignments_write_admin` | ALL | super_admin |
| skill_catalog | `skill_catalog_select` | SELECT | any authenticated |
| skill_catalog | `skill_catalog_write_admin` | ALL | super_admin |
| employee_skills / objectives / key_results | `*_select/insert/update` | * | `can_view_performance_of(employee_id)` |
| employee_skills / objectives / key_results | `*_delete` | DELETE | super_admin **or** HR silo **or** owner |
| one_on_ones | `one_on_ones_select/update` | SELECT/UPDATE | super_admin **or** HR silo **or** participant |
| one_on_ones | `one_on_ones_insert` | INSERT | HR / admin / employee+own manager / manager+report |
| one_on_ones | `one_on_ones_delete` | DELETE | super_admin **or** HR silo **or** manager participant |
| one_on_one_agenda_notes | `agenda_notes_*` | * | `can_access_one_on_one`; insert/update author = self |
| action_items | `action_items_*` | * | 1-to-1 access **or** assignee |
| kudos | `kudos_select` | SELECT | super_admin **or** HR silo **or** home department feed |
| kudos | `kudos_insert` | INSERT | `giver_id = auth.uid()` and home department |
| kudos | `kudos_delete` | DELETE | giver **or** super_admin **or** HR silo |

`profiles` has **no** INSERT/DELETE grants for `authenticated` (signup trigger only).

Helpers used by policies (all `SECURITY DEFINER`, `search_path = public`):
`is_super_admin()`, `is_manager()`, `profile_department_id()`, `is_hr_for_department(uuid)`,
`hr_assigned_department_ids()`, `can_view_performance_of(uuid)`, `can_manage_profile(uuid)`,
`can_access_one_on_one(uuid)`.

## Apply

1. Supabase Dashboard → SQL Editor → run `supabase/migrations/20260828120000_pms_schema_and_rls.sql`
2. Run `supabase/seed.sql` (departments + Finance skill catalog)
3. Run `supabase/tests/rls_department_silo.sql` in a **non-prod** project
4. Confirm this document, then proceed to Next.js UI — **no UI in this change**

## Confirmation checklist

- [ ] Finance HR cannot `SELECT` a Marketing `profiles.id` by guessing the UUID
- [ ] Finance manager cannot read a Finance employee who reports to someone else
- [ ] Finance employee cannot read a peer's `objectives`
- [ ] Employee cannot `UPDATE profiles SET role = 'super_admin'`
- [ ] Client cannot `INSERT` an objective with another department's `department_id`
- [ ] `anon` key returns empty/error on all `public` tables
