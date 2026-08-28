-- Suii PMS — Supabase schema
-- Clerk is the identity provider. RLS reads the Clerk user id from
-- (select auth.jwt() ->> 'sub') — never auth.uid(), which expects a UUID.
-- Enable Clerk as a third-party auth provider in Supabase and add
-- { "role": "authenticated" } to the Clerk session token if the native
-- integration does not inject it automatically.

create extension if not exists "pgcrypto";

do $$
begin
  create type public.app_role as enum ('employee', 'manager', 'admin');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.goal_status as enum ('not_started', 'in_progress', 'achieved');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.approval_status as enum ('draft', 'pending_approval', 'approved', 'rejected');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.cycle_status as enum ('upcoming', 'active', 'closed');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.appraisal_status as enum ('not_started', 'in_progress', 'submitted', 'completed');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.checkin_status as enum ('scheduled', 'completed', 'missed');
exception
  when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- Identity
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  clerk_id text not null unique,
  email text not null unique,
  full_name text not null,
  role public.app_role not null default 'employee',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles (id) on delete cascade,
  manager_id uuid references public.employees (id) on delete set null,
  title text not null,
  department text not null,
  job_role text not null,
  hire_date date,
  created_at timestamptz not null default now()
);

create index if not exists employees_manager_id_idx on public.employees (manager_id);
create index if not exists employees_job_role_idx on public.employees (job_role);
create index if not exists profiles_clerk_id_idx on public.profiles (clerk_id);

-- ---------------------------------------------------------------------------
-- Auth helpers (security definer so RLS on profiles/employees does not recurse)
-- ---------------------------------------------------------------------------

create or replace function public.current_clerk_id()
returns text
language sql
stable
as $$
  select nullif((select auth.jwt() ->> 'sub'), '');
$$;

create or replace function public.current_profile()
returns public.profiles
language sql
stable
security definer
set search_path = public
as $$
  select p.*
  from public.profiles p
  where p.clerk_id = public.current_clerk_id()
  limit 1;
$$;

create or replace function public.current_employee_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select e.id
  from public.employees e
  join public.profiles p on p.id = e.profile_id
  where p.clerk_id = public.current_clerk_id()
  limit 1;
$$;

create or replace function public.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select p.role
  from public.profiles p
  where p.clerk_id = public.current_clerk_id()
  limit 1;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_app_role() = 'admin', false);
$$;

create or replace function public.is_manager_of(target_employee_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_admin()
    or exists (
      select 1
      from public.employees e
      where e.id = target_employee_id
        and e.manager_id = public.current_employee_id()
    );
$$;

create or replace function public.can_access_employee(target_employee_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_admin()
    or target_employee_id = public.current_employee_id()
    or public.is_manager_of(target_employee_id);
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Review cycles, goals (cascading OKRs), key results
-- ---------------------------------------------------------------------------

create table if not exists public.review_cycles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind text not null,
  start_date date not null,
  end_date date not null,
  status public.cycle_status not null default 'upcoming',
  created_at timestamptz not null default now()
);

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id) on delete cascade,
  cycle_id uuid not null references public.review_cycles (id) on delete cascade,
  parent_goal_id uuid references public.goals (id) on delete set null,
  title text not null,
  description text not null default '',
  status public.goal_status not null default 'not_started',
  approval_status public.approval_status not null default 'draft',
  manager_comment text not null default '',
  weight integer not null default 25 check (weight between 1 and 100),
  due_date date,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists goals_employee_id_idx on public.goals (employee_id);
create index if not exists goals_cycle_id_idx on public.goals (cycle_id);
create index if not exists goals_parent_goal_id_idx on public.goals (parent_goal_id);

drop trigger if exists goals_set_updated_at on public.goals;
create trigger goals_set_updated_at
before update on public.goals
for each row execute function public.set_updated_at();

create table if not exists public.key_results (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.goals (id) on delete cascade,
  title text not null,
  metric text not null default '',
  target numeric not null default 1,
  current_value numeric not null default 0,
  unit text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists key_results_goal_id_idx on public.key_results (goal_id);

-- ---------------------------------------------------------------------------
-- 1:1 appraisals
-- ---------------------------------------------------------------------------

create table if not exists public.appraisals (
  id uuid primary key default gen_random_uuid(),
  cycle_id uuid not null references public.review_cycles (id) on delete cascade,
  employee_id uuid not null references public.employees (id) on delete cascade,
  manager_id uuid not null references public.employees (id) on delete restrict,
  self_status public.appraisal_status not null default 'not_started',
  manager_status public.appraisal_status not null default 'not_started',
  self_summary text not null default '',
  manager_summary text not null default '',
  self_rating integer check (self_rating is null or self_rating between 1 and 5),
  manager_rating integer check (manager_rating is null or manager_rating between 1 and 5),
  self_submitted_at timestamptz,
  manager_submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cycle_id, employee_id)
);

create index if not exists appraisals_employee_id_idx on public.appraisals (employee_id);
create index if not exists appraisals_manager_id_idx on public.appraisals (manager_id);

drop trigger if exists appraisals_set_updated_at on public.appraisals;
create trigger appraisals_set_updated_at
before update on public.appraisals
for each row execute function public.set_updated_at();

create table if not exists public.appraisal_scores (
  id uuid primary key default gen_random_uuid(),
  appraisal_id uuid not null references public.appraisals (id) on delete cascade,
  competency text not null,
  self_score integer check (self_score is null or self_score between 1 and 5),
  manager_score integer check (manager_score is null or manager_score between 1 and 5),
  unique (appraisal_id, competency)
);

-- ---------------------------------------------------------------------------
-- Check-ins (used by Flight Risk Radar)
-- ---------------------------------------------------------------------------

create table if not exists public.check_ins (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id) on delete cascade,
  cycle_id uuid not null references public.review_cycles (id) on delete cascade,
  scheduled_at date not null,
  completed_at date,
  status public.checkin_status not null default 'scheduled',
  notes text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists check_ins_employee_id_idx on public.check_ins (employee_id);

-- ---------------------------------------------------------------------------
-- 360° Kudos
-- ---------------------------------------------------------------------------

create table if not exists public.kudos (
  id uuid primary key default gen_random_uuid(),
  from_employee_id uuid not null references public.employees (id) on delete cascade,
  to_employee_id uuid not null references public.employees (id) on delete cascade,
  badge text not null,
  message text not null,
  created_at timestamptz not null default now(),
  constraint kudos_not_self check (from_employee_id <> to_employee_id)
);

create index if not exists kudos_created_at_idx on public.kudos (created_at desc);

-- ---------------------------------------------------------------------------
-- Skills & competency heatmap
-- ---------------------------------------------------------------------------

create table if not exists public.skills (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category text not null
);

create table if not exists public.role_skill_benchmarks (
  id uuid primary key default gen_random_uuid(),
  job_role text not null,
  skill_id uuid not null references public.skills (id) on delete cascade,
  expected_level integer not null check (expected_level between 1 and 5),
  unique (job_role, skill_id)
);

create table if not exists public.employee_skills (
  employee_id uuid not null references public.employees (id) on delete cascade,
  skill_id uuid not null references public.skills (id) on delete cascade,
  level integer not null check (level between 1 and 5),
  primary key (employee_id, skill_id)
);

-- ---------------------------------------------------------------------------
-- Flight risk (managers only)
-- ---------------------------------------------------------------------------

create or replace view public.flight_risk_radar
with (security_invoker = true)
as
select
  e.id as employee_id,
  p.full_name,
  e.title,
  e.department,
  e.manager_id,
  coalesce((
    select round(
      100.0 * count(*) filter (where g.status = 'achieved') / nullif(count(*), 0)
    )
    from public.goals g
    join public.review_cycles c on c.id = g.cycle_id
    where g.employee_id = e.id
      and c.status = 'active'
      and g.approval_status = 'approved'
  ), 0) as goal_completion_rate,
  (
    select count(*)
    from public.check_ins ci
    join public.review_cycles c on c.id = ci.cycle_id
    where ci.employee_id = e.id
      and c.status = 'active'
      and ci.status = 'missed'
  ) as missed_checkins,
  (
    select count(*)
    from public.appraisals a
    join public.review_cycles c on c.id = a.cycle_id
    where a.employee_id = e.id
      and c.status = 'active'
      and a.self_status <> 'completed'
      and a.manager_status <> 'completed'
  ) as pending_reviews,
  (
    case
      when coalesce((
        select round(
          100.0 * count(*) filter (where g.status = 'achieved') / nullif(count(*), 0)
        )
        from public.goals g
        join public.review_cycles c on c.id = g.cycle_id
        where g.employee_id = e.id
          and c.status = 'active'
          and g.approval_status = 'approved'
      ), 0) < 40 then 40 else 0 end
    + (select count(*) * 20
       from public.check_ins ci
       join public.review_cycles c on c.id = ci.cycle_id
       where ci.employee_id = e.id and c.status = 'active' and ci.status = 'missed')
    + (select count(*) * 15
       from public.appraisals a
       join public.review_cycles c on c.id = a.cycle_id
       where a.employee_id = e.id
         and c.status = 'active'
         and a.self_status <> 'completed'
         and a.manager_status <> 'completed')
  )::integer as risk_score
from public.employees e
join public.profiles p on p.id = e.profile_id;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.employees enable row level security;
alter table public.review_cycles enable row level security;
alter table public.goals enable row level security;
alter table public.key_results enable row level security;
alter table public.appraisals enable row level security;
alter table public.appraisal_scores enable row level security;
alter table public.check_ins enable row level security;
alter table public.kudos enable row level security;
alter table public.skills enable row level security;
alter table public.role_skill_benchmarks enable row level security;
alter table public.employee_skills enable row level security;

alter table public.profiles force row level security;
alter table public.employees force row level security;
alter table public.review_cycles force row level security;
alter table public.goals force row level security;
alter table public.key_results force row level security;
alter table public.appraisals force row level security;
alter table public.appraisal_scores force row level security;
alter table public.check_ins force row level security;
alter table public.kudos force row level security;
alter table public.skills force row level security;
alter table public.role_skill_benchmarks force row level security;
alter table public.employee_skills force row level security;

-- Directory: authenticated people can see colleagues (needed for kudos, OKR cascade).
drop policy if exists "profiles_select_authenticated" on public.profiles;
create policy "profiles_select_authenticated"
on public.profiles for select to authenticated
using (true);

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self"
on public.profiles for update to authenticated
using (clerk_id = public.current_clerk_id())
with check (clerk_id = public.current_clerk_id());

drop policy if exists "employees_select_authenticated" on public.employees;
create policy "employees_select_authenticated"
on public.employees for select to authenticated
using (true);

drop policy if exists "employees_update_admin" on public.employees;
create policy "employees_update_admin"
on public.employees for update to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "cycles_select_authenticated" on public.review_cycles;
create policy "cycles_select_authenticated"
on public.review_cycles for select to authenticated
using (true);

drop policy if exists "cycles_write_admin" on public.review_cycles;
create policy "cycles_write_admin"
on public.review_cycles for all to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Goals: owner, their manager, or admin.
drop policy if exists "goals_select_own_or_manager" on public.goals;
create policy "goals_select_own_or_manager"
on public.goals for select to authenticated
using (public.can_access_employee(employee_id));

drop policy if exists "goals_insert_own" on public.goals;
create policy "goals_insert_own"
on public.goals for insert to authenticated
with check (employee_id = public.current_employee_id() or public.is_admin());

drop policy if exists "goals_update_own_or_manager" on public.goals;
create policy "goals_update_own_or_manager"
on public.goals for update to authenticated
using (public.can_access_employee(employee_id))
with check (public.can_access_employee(employee_id));

drop policy if exists "goals_delete_own_draft" on public.goals;
create policy "goals_delete_own_draft"
on public.goals for delete to authenticated
using (
  (employee_id = public.current_employee_id() and approval_status in ('draft', 'rejected'))
  or public.is_admin()
);

drop policy if exists "key_results_select" on public.key_results;
create policy "key_results_select"
on public.key_results for select to authenticated
using (
  exists (
    select 1 from public.goals g
    where g.id = key_results.goal_id
      and public.can_access_employee(g.employee_id)
  )
);

drop policy if exists "key_results_write" on public.key_results;
create policy "key_results_write"
on public.key_results for all to authenticated
using (
  exists (
    select 1 from public.goals g
    where g.id = key_results.goal_id
      and public.can_access_employee(g.employee_id)
  )
)
with check (
  exists (
    select 1 from public.goals g
    where g.id = key_results.goal_id
      and public.can_access_employee(g.employee_id)
  )
);

drop policy if exists "appraisals_select" on public.appraisals;
create policy "appraisals_select"
on public.appraisals for select to authenticated
using (public.can_access_employee(employee_id));

drop policy if exists "appraisals_insert_admin" on public.appraisals;
create policy "appraisals_insert_admin"
on public.appraisals for insert to authenticated
with check (public.is_admin() or manager_id = public.current_employee_id());

drop policy if exists "appraisals_update" on public.appraisals;
create policy "appraisals_update"
on public.appraisals for update to authenticated
using (public.can_access_employee(employee_id))
with check (public.can_access_employee(employee_id));

drop policy if exists "appraisal_scores_select" on public.appraisal_scores;
create policy "appraisal_scores_select"
on public.appraisal_scores for select to authenticated
using (
  exists (
    select 1 from public.appraisals a
    where a.id = appraisal_scores.appraisal_id
      and public.can_access_employee(a.employee_id)
  )
);

drop policy if exists "appraisal_scores_write" on public.appraisal_scores;
create policy "appraisal_scores_write"
on public.appraisal_scores for all to authenticated
using (
  exists (
    select 1 from public.appraisals a
    where a.id = appraisal_scores.appraisal_id
      and public.can_access_employee(a.employee_id)
  )
)
with check (
  exists (
    select 1 from public.appraisals a
    where a.id = appraisal_scores.appraisal_id
      and public.can_access_employee(a.employee_id)
  )
);

drop policy if exists "check_ins_select" on public.check_ins;
create policy "check_ins_select"
on public.check_ins for select to authenticated
using (public.can_access_employee(employee_id));

drop policy if exists "check_ins_write_manager" on public.check_ins;
create policy "check_ins_write_manager"
on public.check_ins for all to authenticated
using (public.is_manager_of(employee_id) or employee_id = public.current_employee_id())
with check (public.is_manager_of(employee_id) or employee_id = public.current_employee_id());

-- Public team feed for authenticated users.
drop policy if exists "kudos_select_authenticated" on public.kudos;
create policy "kudos_select_authenticated"
on public.kudos for select to authenticated
using (true);

drop policy if exists "kudos_insert_own" on public.kudos;
create policy "kudos_insert_own"
on public.kudos for insert to authenticated
with check (from_employee_id = public.current_employee_id());

drop policy if exists "kudos_delete_own" on public.kudos;
create policy "kudos_delete_own"
on public.kudos for delete to authenticated
using (from_employee_id = public.current_employee_id() or public.is_admin());

drop policy if exists "skills_select" on public.skills;
create policy "skills_select"
on public.skills for select to authenticated
using (true);

drop policy if exists "benchmarks_select" on public.role_skill_benchmarks;
create policy "benchmarks_select"
on public.role_skill_benchmarks for select to authenticated
using (true);

drop policy if exists "employee_skills_select" on public.employee_skills;
create policy "employee_skills_select"
on public.employee_skills for select to authenticated
using (public.can_access_employee(employee_id) or public.is_admin());

drop policy if exists "employee_skills_write" on public.employee_skills;
create policy "employee_skills_write"
on public.employee_skills for all to authenticated
using (employee_id = public.current_employee_id() or public.is_admin())
with check (employee_id = public.current_employee_id() or public.is_admin());

grant usage on schema public to authenticated, anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant select on public.flight_risk_radar to authenticated;
revoke all on all tables in schema public from anon;
