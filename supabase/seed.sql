-- Demo seed for Suii PMS. Run after schema.sql.
-- clerk_id values are placeholders; the Clerk webhook overwrites them on first sign-in
-- when matching email. For local demo auth, these ids are the session keys.

begin;

delete from public.employee_skills;
delete from public.role_skill_benchmarks;
delete from public.skills;
delete from public.kudos;
delete from public.check_ins;
delete from public.appraisal_scores;
delete from public.appraisals;
delete from public.key_results;
delete from public.goals;
delete from public.review_cycles;
delete from public.employees;
delete from public.profiles;

insert into public.profiles (id, clerk_id, email, full_name, role) values
  ('11111111-1111-1111-1111-111111111111', 'user_demo_priya',  'priya@suii.app',  'Priya Nair',     'admin'),
  ('22222222-2222-2222-2222-222222222222', 'user_demo_marcus', 'marcus@suii.app', 'Marcus Chen',    'manager'),
  ('33333333-3333-3333-3333-333333333333', 'user_demo_maya',   'maya@suii.app',   'Maya Okonkwo',   'manager'),
  ('44444444-4444-4444-4444-444444444444', 'user_demo_aisha',  'aisha@suii.app',  'Aisha Rahman',   'employee'),
  ('55555555-5555-5555-5555-555555555555', 'user_demo_samir',  'samir@suii.app',  'Samir Joshi',    'employee'),
  ('66666666-6666-6666-6666-666666666666', 'user_demo_leo',    'leo@suii.app',    'Leo Park',       'employee'),
  ('77777777-7777-7777-7777-777777777777', 'user_demo_jordan', 'jordan@suii.app', 'Jordan Hale',    'employee');

insert into public.employees (id, profile_id, manager_id, title, department, job_role, hire_date) values
  ('a1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', null,                                 'Head of People',            'People',      'People Partner',     '2021-03-01'),
  ('a2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'a1111111-1111-1111-1111-111111111111', 'Engineering Manager',      'Engineering', 'Engineering Manager','2022-01-10'),
  ('a3333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'a1111111-1111-1111-1111-111111111111', 'Design Manager',           'Design',      'Design Manager',     '2022-06-01'),
  ('a4444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', 'a2222222-2222-2222-2222-222222222222', 'Senior Software Engineer', 'Engineering', 'Senior Engineer',    '2023-02-14'),
  ('a5555555-5555-5555-5555-555555555555', '55555555-5555-5555-5555-555555555555', 'a2222222-2222-2222-2222-222222222222', 'Software Engineer',        'Engineering', 'Engineer',           '2024-04-01'),
  ('a6666666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', 'a3333333-3333-3333-3333-333333333333', 'Product Designer',         'Design',      'Product Designer',   '2023-09-18'),
  ('a7777777-7777-7777-7777-777777777777', '77777777-7777-7777-7777-777777777777', 'a1111111-1111-1111-1111-111111111111', 'Product Manager',          'Product',     'Product Manager',    '2022-11-07');

insert into public.review_cycles (id, name, kind, start_date, end_date, status) values
  ('c0000000-0000-0000-0000-000000000001', 'FY25 Annual Review', 'Annual',   '2025-11-01', '2026-01-15', 'closed'),
  ('c0000000-0000-0000-0000-000000000002', 'FY26 H1 Review',     'Mid-year', '2026-07-01', '2026-09-30', 'active'),
  ('c0000000-0000-0000-0000-000000000003', 'FY26 Annual Review', 'Annual',   '2026-11-01', '2027-01-15', 'upcoming');

-- Company parent objective owned by Priya, then team/individual cascade.
insert into public.goals (id, employee_id, cycle_id, parent_goal_id, title, description, status, approval_status, weight, due_date, submitted_at, reviewed_at) values
  ('g0000000-0000-0000-0000-000000000001', 'a1111111-1111-1111-1111-111111111111', 'c0000000-0000-0000-0000-000000000002', null,
    'Make performance conversations worth having',
    'Company OKR: ship a trusted review system and raise completion quality.',
    'in_progress', 'approved', 40, '2026-09-30', now(), now()),
  ('g0000000-0000-0000-0000-000000000002', 'a2222222-2222-2222-2222-222222222222', 'c0000000-0000-0000-0000-000000000002', 'g0000000-0000-0000-0000-000000000001',
    'Raise engineering delivery predictability',
    'Keep spillover under 15% and close 1:1s on time.',
    'in_progress', 'approved', 30, '2026-09-30', now(), now()),
  ('g0000000-0000-0000-0000-000000000003', 'a4444444-4444-4444-4444-444444444444', 'c0000000-0000-0000-0000-000000000002', 'g0000000-0000-0000-0000-000000000002',
    'Ship reliability dashboard for production services',
    'Live view of latency, error budget, and incident MTTR.',
    'in_progress', 'approved', 40, '2026-09-15', now(), now()),
  ('g0000000-0000-0000-0000-000000000004', 'a5555555-5555-5555-5555-555555555555', 'c0000000-0000-0000-0000-000000000002', 'g0000000-0000-0000-0000-000000000002',
    'Reduce p95 API latency on checkout',
    'Profile hot paths and ship caching plus query improvements.',
    'not_started', 'pending_approval', 50, '2026-08-31', now(), null),
  ('g0000000-0000-0000-0000-000000000005', 'a6666666-6666-6666-6666-666666666666', 'c0000000-0000-0000-0000-000000000002', 'g0000000-0000-0000-0000-000000000001',
    'Redesign the self-review experience',
    'Clearer rubrics and manager prompts.',
    'in_progress', 'approved', 35, '2026-09-01', now(), now()),
  ('g0000000-0000-0000-0000-000000000006', 'a5555555-5555-5555-5555-555555555555', 'c0000000-0000-0000-0000-000000000002', null,
    'Complete first on-call rotation independently',
    'Shadow two incidents and own a retro.',
    'not_started', 'draft', 20, '2026-09-30', null, null);

insert into public.key_results (goal_id, title, metric, target, current_value, unit, sort_order) values
  ('g0000000-0000-0000-0000-000000000001', 'Review completion rate', 'Completion', 95, 62, '%', 1),
  ('g0000000-0000-0000-0000-000000000002', 'Sprint spillover', 'Spillover', 15, 18, '%', 1),
  ('g0000000-0000-0000-0000-000000000003', 'Services instrumented', 'Coverage', 8, 5, 'services', 1),
  ('g0000000-0000-0000-0000-000000000004', 'Checkout p95', 'Latency', 180, 240, 'ms', 1),
  ('g0000000-0000-0000-0000-000000000005', 'Usability tests', 'Sessions', 12, 9, 'sessions', 1);

insert into public.appraisals (id, cycle_id, employee_id, manager_id, self_status, manager_status, self_summary, self_rating) values
  ('r0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 'a4444444-4444-4444-4444-444444444444', 'a2222222-2222-2222-2222-222222222222',
    'in_progress', 'not_started',
    'Led reliability instrumentation for five services and started mentoring Samir.', 4),
  ('r0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002', 'a5555555-5555-5555-5555-555555555555', 'a2222222-2222-2222-2222-222222222222',
    'not_started', 'not_started', '', null),
  ('r0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000002', 'a6666666-6666-6666-6666-666666666666', 'a3333333-3333-3333-3333-333333333333',
    'submitted', 'in_progress',
    'Completed usability tests on the review flow.', 4);

insert into public.appraisal_scores (appraisal_id, competency, self_score) values
  ('r0000000-0000-0000-0000-000000000001', 'Impact', 4),
  ('r0000000-0000-0000-0000-000000000001', 'Collaboration', 4),
  ('r0000000-0000-0000-0000-000000000001', 'Craft', 5),
  ('r0000000-0000-0000-0000-000000000001', 'Ownership', 4),
  ('r0000000-0000-0000-0000-000000000001', 'Growth', 4),
  ('r0000000-0000-0000-0000-000000000002', 'Impact', null),
  ('r0000000-0000-0000-0000-000000000002', 'Collaboration', null),
  ('r0000000-0000-0000-0000-000000000002', 'Craft', null),
  ('r0000000-0000-0000-0000-000000000002', 'Ownership', null),
  ('r0000000-0000-0000-0000-000000000002', 'Growth', null),
  ('r0000000-0000-0000-0000-000000000003', 'Impact', 4),
  ('r0000000-0000-0000-0000-000000000003', 'Collaboration', 5),
  ('r0000000-0000-0000-0000-000000000003', 'Craft', 5),
  ('r0000000-0000-0000-0000-000000000003', 'Ownership', 4),
  ('r0000000-0000-0000-0000-000000000003', 'Growth', 4);

insert into public.check_ins (employee_id, cycle_id, scheduled_at, completed_at, status, notes) values
  ('a4444444-4444-4444-4444-444444444444', 'c0000000-0000-0000-0000-000000000002', '2026-07-15', '2026-07-15', 'completed', 'On track'),
  ('a4444444-4444-4444-4444-444444444444', 'c0000000-0000-0000-0000-000000000002', '2026-08-15', '2026-08-15', 'completed', 'Dashboard live'),
  ('a5555555-5555-5555-5555-555555555555', 'c0000000-0000-0000-0000-000000000002', '2026-07-15', null, 'missed', ''),
  ('a5555555-5555-5555-5555-555555555555', 'c0000000-0000-0000-0000-000000000002', '2026-08-15', null, 'missed', ''),
  ('a6666666-6666-6666-6666-666666666666', 'c0000000-0000-0000-0000-000000000002', '2026-08-01', '2026-08-01', 'completed', 'Prototype review');

insert into public.kudos (from_employee_id, to_employee_id, badge, message, created_at) values
  ('a2222222-2222-2222-2222-222222222222', 'a4444444-4444-4444-4444-444444444444', 'Impact',
    'The reliability charts made incident tradeoffs obvious. That is the leadership I want more of.', now() - interval '2 days'),
  ('a5555555-5555-5555-5555-555555555555', 'a4444444-4444-4444-4444-444444444444', 'Growth',
    'Thanks for walking me through the on-call runbook.', now() - interval '1 day'),
  ('a7777777-7777-7777-7777-777777777777', 'a6666666-6666-6666-6666-666666666666', 'Craft',
    'The self-review prototype cut our confusion in half.', now() - interval '3 hours');

insert into public.skills (id, name, category) values
  ('s0000000-0000-0000-0000-000000000001', 'System design', 'Craft'),
  ('s0000000-0000-0000-0000-000000000002', 'Incident response', 'Craft'),
  ('s0000000-0000-0000-0000-000000000003', 'Coaching', 'Leadership'),
  ('s0000000-0000-0000-0000-000000000004', 'Product sense', 'Product'),
  ('s0000000-0000-0000-0000-000000000005', 'Written communication', 'Collaboration'),
  ('s0000000-0000-0000-0000-000000000006', 'Visual design', 'Craft');

insert into public.role_skill_benchmarks (job_role, skill_id, expected_level) values
  ('Senior Engineer', 's0000000-0000-0000-0000-000000000001', 4),
  ('Senior Engineer', 's0000000-0000-0000-0000-000000000002', 4),
  ('Senior Engineer', 's0000000-0000-0000-0000-000000000003', 3),
  ('Senior Engineer', 's0000000-0000-0000-0000-000000000005', 4),
  ('Engineer', 's0000000-0000-0000-0000-000000000001', 3),
  ('Engineer', 's0000000-0000-0000-0000-000000000002', 3),
  ('Engineer', 's0000000-0000-0000-0000-000000000005', 3),
  ('Engineering Manager', 's0000000-0000-0000-0000-000000000003', 5),
  ('Engineering Manager', 's0000000-0000-0000-0000-000000000005', 4),
  ('Product Designer', 's0000000-0000-0000-0000-000000000006', 4),
  ('Product Designer', 's0000000-0000-0000-0000-000000000004', 3),
  ('Product Designer', 's0000000-0000-0000-0000-000000000005', 4);

insert into public.employee_skills (employee_id, skill_id, level) values
  ('a4444444-4444-4444-4444-444444444444', 's0000000-0000-0000-0000-000000000001', 4),
  ('a4444444-4444-4444-4444-444444444444', 's0000000-0000-0000-0000-000000000002', 5),
  ('a4444444-4444-4444-4444-444444444444', 's0000000-0000-0000-0000-000000000003', 3),
  ('a4444444-4444-4444-4444-444444444444', 's0000000-0000-0000-0000-000000000005', 4),
  ('a5555555-5555-5555-5555-555555555555', 's0000000-0000-0000-0000-000000000001', 2),
  ('a5555555-5555-5555-5555-555555555555', 's0000000-0000-0000-0000-000000000002', 2),
  ('a5555555-5555-5555-5555-555555555555', 's0000000-0000-0000-0000-000000000005', 3),
  ('a2222222-2222-2222-2222-222222222222', 's0000000-0000-0000-0000-000000000003', 4),
  ('a2222222-2222-2222-2222-222222222222', 's0000000-0000-0000-0000-000000000005', 4),
  ('a6666666-6666-6666-6666-666666666666', 's0000000-0000-0000-0000-000000000006', 5),
  ('a6666666-6666-6666-6666-666666666666', 's0000000-0000-0000-0000-000000000004', 3),
  ('a6666666-6666-6666-6666-666666666666', 's0000000-0000-0000-0000-000000000005', 4);

commit;
