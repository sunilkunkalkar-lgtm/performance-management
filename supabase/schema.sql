-- Suii PMS — task management schema with 3-role RBAC
-- Roles: boss, hr, employee

create extension if not exists "pgcrypto";

do $$
begin
  create type public.app_role as enum ('boss', 'hr', 'employee');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.task_status as enum ('not_started', 'in_progress', 'completed');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.task_priority as enum ('low', 'medium', 'high');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  clerk_id text not null unique,
  email text not null unique,
  full_name text not null,
  role public.app_role not null default 'employee',
  password_hash text not null default '',
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

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  assignee_id uuid not null references public.employees (id) on delete cascade,
  created_by_id uuid not null references public.employees (id) on delete restrict,
  status public.task_status not null default 'not_started',
  priority public.task_priority not null default 'medium',
  due_date date,
  is_blocked boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.task_comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks (id) on delete cascade,
  author_id uuid not null references public.employees (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create or replace function public.current_clerk_id()
returns text
language sql
stable
as $$
  select nullif((select auth.jwt() ->> 'sub'), '');
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

alter table public.profiles enable row level security;
alter table public.employees enable row level security;
alter table public.tasks enable row level security;
alter table public.task_comments enable row level security;

drop policy if exists "profiles_select_self_or_staff" on public.profiles;
create policy "profiles_select_self_or_staff"
on public.profiles for select to authenticated
using (
  clerk_id = public.current_clerk_id()
  or public.current_app_role() in ('boss', 'hr')
);

drop policy if exists "employees_select_staff_or_self" on public.employees;
create policy "employees_select_staff_or_self"
on public.employees for select to authenticated
using (
  id = public.current_employee_id()
  or public.current_app_role() in ('boss', 'hr')
);

drop policy if exists "employees_write_hr" on public.employees;
create policy "employees_write_hr"
on public.employees for all to authenticated
using (public.current_app_role() = 'hr')
with check (public.current_app_role() = 'hr');

drop policy if exists "tasks_select_role_scoped" on public.tasks;
create policy "tasks_select_role_scoped"
on public.tasks for select to authenticated
using (
  public.current_app_role() in ('boss', 'hr')
  or assignee_id = public.current_employee_id()
);

drop policy if exists "tasks_insert_boss" on public.tasks;
create policy "tasks_insert_boss"
on public.tasks for insert to authenticated
with check (public.current_app_role() = 'boss');

drop policy if exists "tasks_update_assignee_or_boss" on public.tasks;
create policy "tasks_update_assignee_or_boss"
on public.tasks for update to authenticated
using (
  assignee_id = public.current_employee_id()
  or public.current_app_role() = 'boss'
)
with check (
  assignee_id = public.current_employee_id()
  or public.current_app_role() = 'boss'
);

drop policy if exists "task_comments_select_role_scoped" on public.task_comments;
create policy "task_comments_select_role_scoped"
on public.task_comments for select to authenticated
using (
  exists (
    select 1 from public.tasks t
    where t.id = task_comments.task_id
      and (
        public.current_app_role() in ('boss', 'hr')
        or t.assignee_id = public.current_employee_id()
      )
  )
);

drop policy if exists "task_comments_insert_visible" on public.task_comments;
create policy "task_comments_insert_visible"
on public.task_comments for insert to authenticated
with check (
  author_id = public.current_employee_id()
  and exists (
    select 1 from public.tasks t
    where t.id = task_comments.task_id
      and (
        public.current_app_role() in ('boss', 'hr')
        or t.assignee_id = public.current_employee_id()
      )
  )
);

grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
