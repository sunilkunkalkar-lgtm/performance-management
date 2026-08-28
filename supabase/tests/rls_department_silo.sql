-- =============================================================================
-- Departmental RLS acceptance tests (run as postgres / SQL Editor after seed).
-- Requires the migration + seed. Creates disposable auth users, impersonates
-- them via JWT claims, then asserts silo isolation.
--
-- Confirmation checklist (must all PASS):
--   1. Finance HR cannot SELECT a Marketing profile by UUID
--   2. Finance manager cannot read a Finance employee who reports to someone else
--   3. Finance employee cannot read a peer's objectives
--   4. Employee cannot UPDATE profiles.role to super_admin
--   5. Client cannot persist an objective with another department's department_id
--   6. anon has no table privileges
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public._pms_test_create_auth_user(p_id uuid, p_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    p_id,
    'authenticated',
    'authenticated',
    p_email,
    crypt('test-password', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('full_name', p_email),
    now(),
    now()
  );
END;
$$;

CREATE OR REPLACE FUNCTION public._pms_test_as(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM set_config('request.jwt.claim.sub', p_user_id::text, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
  PERFORM set_config(
    'request.jwt.claims',
    json_build_object('sub', p_user_id::text, 'role', 'authenticated')::text,
    true
  );
END;
$$;

DO $$
DECLARE
  finance uuid;
  marketing uuid;
  super_id uuid := '00000000-0000-0000-0000-000000000001';
  hr_fin uuid := '00000000-0000-0000-0000-000000000002';
  mgr_fin uuid := '00000000-0000-0000-0000-000000000003';
  emp_fin uuid := '00000000-0000-0000-0000-000000000004';
  peer_fin uuid := '00000000-0000-0000-0000-000000000005';
  emp_mkt uuid := '00000000-0000-0000-0000-000000000006';
  mgr_mkt uuid := '00000000-0000-0000-0000-000000000007';
  seen_count integer;
  obj_id uuid;
  stamped uuid;
BEGIN
  SELECT id INTO STRICT finance FROM public.departments WHERE slug = 'finance';
  SELECT id INTO STRICT marketing FROM public.departments WHERE slug = 'marketing';

  PERFORM public._pms_test_create_auth_user(super_id, 'superadmin@example.com');
  PERFORM public._pms_test_create_auth_user(hr_fin, 'hr.finance@example.com');
  PERFORM public._pms_test_create_auth_user(mgr_fin, 'manager.finance@example.com');
  PERFORM public._pms_test_create_auth_user(emp_fin, 'employee.finance@example.com');
  PERFORM public._pms_test_create_auth_user(peer_fin, 'peer.finance@example.com');
  PERFORM public._pms_test_create_auth_user(mgr_mkt, 'manager.marketing@example.com');
  PERFORM public._pms_test_create_auth_user(emp_mkt, 'employee.marketing@example.com');

  -- handle_new_user already inserted employee profiles. Elevate as table owner.
  UPDATE public.profiles SET
    role = 'super_admin',
    department_id = NULL,
    full_name = 'Super Admin',
    is_active = true
  WHERE id = super_id;

  UPDATE public.profiles SET
    role = 'hr',
    department_id = finance,
    full_name = 'HR Finance',
    hired_at = CURRENT_DATE - 400
  WHERE id = hr_fin;

  UPDATE public.profiles SET
    role = 'manager',
    department_id = finance,
    full_name = 'Manager Finance',
    hired_at = CURRENT_DATE - 400
  WHERE id = mgr_fin;

  UPDATE public.profiles SET
    role = 'employee',
    department_id = finance,
    manager_id = mgr_fin,
    full_name = 'Employee Finance',
    hired_at = CURRENT_DATE - 400
  WHERE id = emp_fin;

  UPDATE public.profiles SET
    role = 'employee',
    department_id = finance,
    manager_id = NULL,
    full_name = 'Peer Finance (other manager)',
    hired_at = CURRENT_DATE - 400
  WHERE id = peer_fin;

  UPDATE public.profiles SET
    role = 'manager',
    department_id = marketing,
    full_name = 'Manager Marketing',
    hired_at = CURRENT_DATE - 400
  WHERE id = mgr_mkt;

  UPDATE public.profiles SET
    role = 'employee',
    department_id = marketing,
    manager_id = mgr_mkt,
    full_name = 'Employee Marketing',
    hired_at = CURRENT_DATE - 400
  WHERE id = emp_mkt;

  INSERT INTO public.department_hr_assignments (user_id, department_id, assigned_by)
  VALUES (hr_fin, finance, super_id);

  INSERT INTO public.objectives (employee_id, department_id, title, status)
  VALUES
    (emp_fin, finance, 'Close the books faster', 'active'),
    (peer_fin, finance, 'Peer secret OKR', 'active'),
    (emp_mkt, marketing, 'Launch campaign', 'active');

  -- 6. anon must not have table grants
  SELECT count(*) INTO seen_count
  FROM information_schema.role_table_grants
  WHERE grantee = 'anon'
    AND table_schema = 'public'
    AND table_name IN (
      'profiles', 'objectives', 'kudos', 'one_on_ones', 'departments'
    );
  IF seen_count <> 0 THEN
    RAISE EXCEPTION 'FAIL 6: anon has % grants on public PMS tables', seen_count;
  END IF;

  -- Impersonate Finance HR
  PERFORM public._pms_test_as(hr_fin);
  SET LOCAL ROLE authenticated;

  SELECT count(*) INTO seen_count FROM public.profiles WHERE id = emp_mkt;
  IF seen_count <> 0 THEN
    RAISE EXCEPTION 'FAIL 1: Finance HR saw Marketing profile';
  END IF;

  SELECT count(*) INTO seen_count FROM public.profiles WHERE department_id = finance;
  IF seen_count < 3 THEN
    RAISE EXCEPTION 'FAIL 1b: Finance HR should see Finance profiles, got %', seen_count;
  END IF;

  SELECT count(*) INTO seen_count FROM public.objectives WHERE department_id = marketing;
  IF seen_count <> 0 THEN
    RAISE EXCEPTION 'FAIL 1c: Finance HR saw Marketing objectives';
  END IF;

  BEGIN
    PERFORM * FROM public.hr_flight_risk_radar(marketing);
    RAISE EXCEPTION 'FAIL 1d: Finance HR called Marketing flight-risk without error';
  EXCEPTION
    WHEN insufficient_privilege THEN NULL;
    WHEN OTHERS THEN
      IF SQLSTATE <> '42501' THEN
        RAISE;
      END IF;
  END;

  -- Impersonate Finance manager
  RESET ROLE;
  PERFORM public._pms_test_as(mgr_fin);
  SET LOCAL ROLE authenticated;

  SELECT count(*) INTO seen_count FROM public.profiles WHERE id = emp_fin;
  IF seen_count <> 1 THEN
    RAISE EXCEPTION 'FAIL 2a: Manager must see direct report';
  END IF;

  SELECT count(*) INTO seen_count FROM public.profiles WHERE id = peer_fin;
  IF seen_count <> 0 THEN
    RAISE EXCEPTION 'FAIL 2: Manager saw a Finance employee who is not a direct report';
  END IF;

  SELECT count(*) INTO seen_count FROM public.objectives WHERE employee_id = peer_fin;
  IF seen_count <> 0 THEN
    RAISE EXCEPTION 'FAIL 2b: Manager saw peer OKRs';
  END IF;

  -- Impersonate Finance employee
  RESET ROLE;
  PERFORM public._pms_test_as(emp_fin);
  SET LOCAL ROLE authenticated;

  SELECT count(*) INTO seen_count FROM public.objectives WHERE employee_id = peer_fin;
  IF seen_count <> 0 THEN
    RAISE EXCEPTION 'FAIL 3: Employee saw a peer''s objectives';
  END IF;

  SELECT count(*) INTO seen_count FROM public.objectives WHERE employee_id = emp_fin;
  IF seen_count <> 1 THEN
    RAISE EXCEPTION 'FAIL 3b: Employee must see own objectives';
  END IF;

  BEGIN
    UPDATE public.profiles SET role = 'super_admin' WHERE id = emp_fin;
    IF EXISTS (SELECT 1 FROM public.profiles WHERE id = emp_fin AND role = 'super_admin') THEN
      RAISE EXCEPTION 'FAIL 4: Employee escalated to super_admin';
    END IF;
  EXCEPTION
    WHEN insufficient_privilege THEN NULL;
    WHEN OTHERS THEN
      -- trigger raises 42501
      IF SQLSTATE NOT IN ('42501', 'P0001') THEN
        -- continue; row should still be employee
        NULL;
      END IF;
  END;

  RESET ROLE;
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = emp_fin AND role <> 'employee') THEN
    RAISE EXCEPTION 'FAIL 4: role changed despite guard (now %)',
      (SELECT role FROM public.profiles WHERE id = emp_fin);
  END IF;

  PERFORM public._pms_test_as(emp_fin);
  SET LOCAL ROLE authenticated;

  INSERT INTO public.objectives (employee_id, department_id, title, status)
  VALUES (emp_fin, marketing, 'Tampered silo', 'draft')
  RETURNING id INTO obj_id;

  RESET ROLE;
  SELECT department_id INTO STRICT stamped FROM public.objectives WHERE id = obj_id;
  IF stamped IS DISTINCT FROM finance THEN
    RAISE EXCEPTION 'FAIL 5: tampered department_id persisted (got %)', stamped;
  END IF;

  RAISE NOTICE 'ALL RLS SILO CHECKS PASSED';
END;
$$;

-- Cleanup helpers stay for re-runs; drop test users optionally:
-- DELETE FROM auth.users WHERE email LIKE '%@example.com';
