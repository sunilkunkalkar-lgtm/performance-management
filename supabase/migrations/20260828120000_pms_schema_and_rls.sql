-- =============================================================================
-- PMS: departmental schema + Row Level Security
-- Paste into Supabase SQL Editor or apply via `supabase db reset`.
-- Frontend is untrusted. Department silos are enforced here.
-- =============================================================================

-- gen_random_uuid() is provided by PostgreSQL 13+ (Supabase PG 15).

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------

CREATE TYPE public.app_role AS ENUM ('super_admin', 'hr', 'manager', 'employee');
CREATE TYPE public.objective_status AS ENUM (
  'draft', 'active', 'stalled', 'completed', 'cancelled'
);
CREATE TYPE public.one_on_one_status AS ENUM (
  'scheduled', 'in_progress', 'completed', 'cancelled', 'no_show'
);
CREATE TYPE public.action_item_status AS ENUM ('open', 'done', 'cancelled');

-- -----------------------------------------------------------------------------
-- Tables
-- -----------------------------------------------------------------------------

CREATE TABLE public.departments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text NOT NULL UNIQUE,
  name        text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.departments IS
  'Org silo key. Finance / Marketing / Logistics are separate rows; RLS never returns foreign silos.';

CREATE TABLE public.profiles (
  id             uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email          text NOT NULL UNIQUE,
  full_name      text NOT NULL DEFAULT '',
  title          text,
  avatar_url     text,
  role           public.app_role NOT NULL DEFAULT 'employee',
  department_id  uuid REFERENCES public.departments (id) ON DELETE RESTRICT,
  manager_id     uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  hired_at       date,
  is_active      boolean NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT profiles_no_self_manager CHECK (manager_id IS DISTINCT FROM id)
);

CREATE INDEX profiles_department_id_idx ON public.profiles (department_id);
CREATE INDEX profiles_manager_id_idx ON public.profiles (manager_id);
CREATE INDEX profiles_role_idx ON public.profiles (role);

COMMENT ON TABLE public.profiles IS
  'One row per auth user. role + department_id are the source of truth (not JWT claims).';

CREATE TABLE public.department_hr_assignments (
  user_id        uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  department_id  uuid NOT NULL REFERENCES public.departments (id) ON DELETE CASCADE,
  assigned_by    uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  assigned_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, department_id)
);

CREATE INDEX department_hr_assignments_department_id_idx
  ON public.department_hr_assignments (department_id);

COMMENT ON TABLE public.department_hr_assignments IS
  'SuperAdmin grant: the only way an hr user may read/write a departmental silo.';

CREATE TABLE public.skill_catalog (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text NOT NULL UNIQUE,
  name        text NOT NULL,
  category    text,
  sort_order  integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.employee_skills (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id     uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  skill_id        uuid NOT NULL REFERENCES public.skill_catalog (id) ON DELETE CASCADE,
  department_id   uuid NOT NULL REFERENCES public.departments (id) ON DELETE RESTRICT,
  proficiency     smallint NOT NULL CHECK (proficiency BETWEEN 1 AND 5),
  assessed_at     date NOT NULL DEFAULT CURRENT_DATE,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (employee_id, skill_id)
);

CREATE INDEX employee_skills_department_id_idx ON public.employee_skills (department_id);
CREATE INDEX employee_skills_employee_id_idx ON public.employee_skills (employee_id);

CREATE TABLE public.objectives (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id        uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  department_id      uuid NOT NULL REFERENCES public.departments (id) ON DELETE RESTRICT,
  title              text NOT NULL,
  description        text,
  status             public.objective_status NOT NULL DEFAULT 'draft',
  cycle_start        date,
  cycle_end          date,
  last_progress_at   timestamptz,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX objectives_employee_id_idx ON public.objectives (employee_id);
CREATE INDEX objectives_department_id_idx ON public.objectives (department_id);
CREATE INDEX objectives_status_progress_idx ON public.objectives (status, last_progress_at);

CREATE TABLE public.key_results (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  objective_id      uuid NOT NULL REFERENCES public.objectives (id) ON DELETE CASCADE,
  employee_id       uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  department_id     uuid NOT NULL REFERENCES public.departments (id) ON DELETE RESTRICT,
  title             text NOT NULL,
  target_value      numeric,
  current_value     numeric NOT NULL DEFAULT 0,
  unit              text,
  progress_pct      numeric NOT NULL DEFAULT 0 CHECK (progress_pct BETWEEN 0 AND 100),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX key_results_objective_id_idx ON public.key_results (objective_id);
CREATE INDEX key_results_department_id_idx ON public.key_results (department_id);
CREATE INDEX key_results_employee_id_idx ON public.key_results (employee_id);

CREATE TABLE public.one_on_ones (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id     uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  manager_id      uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  department_id   uuid NOT NULL REFERENCES public.departments (id) ON DELETE RESTRICT,
  scheduled_at    timestamptz NOT NULL,
  completed_at    timestamptz,
  status          public.one_on_one_status NOT NULL DEFAULT 'scheduled',
  cycle_month     date,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT one_on_ones_distinct_participants CHECK (employee_id <> manager_id)
);

CREATE INDEX one_on_ones_employee_id_idx ON public.one_on_ones (employee_id);
CREATE INDEX one_on_ones_manager_id_idx ON public.one_on_ones (manager_id);
CREATE INDEX one_on_ones_department_id_idx ON public.one_on_ones (department_id);
CREATE INDEX one_on_ones_completed_at_idx ON public.one_on_ones (employee_id, status, completed_at);

CREATE TABLE public.one_on_one_agenda_notes (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  one_on_one_id   uuid NOT NULL REFERENCES public.one_on_ones (id) ON DELETE CASCADE,
  author_id       uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  department_id   uuid NOT NULL REFERENCES public.departments (id) ON DELETE RESTRICT,
  body            text NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX one_on_one_agenda_notes_ooo_idx ON public.one_on_one_agenda_notes (one_on_one_id);

CREATE TABLE public.action_items (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  one_on_one_id   uuid NOT NULL REFERENCES public.one_on_ones (id) ON DELETE CASCADE,
  assignee_id     uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  department_id   uuid NOT NULL REFERENCES public.departments (id) ON DELETE RESTRICT,
  title           text NOT NULL,
  due_at          date,
  status          public.action_item_status NOT NULL DEFAULT 'open',
  completed_at    timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX action_items_ooo_idx ON public.action_items (one_on_one_id);
CREATE INDEX action_items_assignee_idx ON public.action_items (assignee_id);
CREATE INDEX action_items_department_id_idx ON public.action_items (department_id);

CREATE TABLE public.kudos (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  giver_id        uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  recipient_id    uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  department_id   uuid NOT NULL REFERENCES public.departments (id) ON DELETE RESTRICT,
  body            text NOT NULL,
  tags            text[] NOT NULL DEFAULT '{}',
  created_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT kudos_no_self CHECK (giver_id <> recipient_id)
);

CREATE INDEX kudos_department_created_idx ON public.kudos (department_id, created_at DESC);
CREATE INDEX kudos_recipient_id_idx ON public.kudos (recipient_id);
CREATE INDEX kudos_giver_id_idx ON public.kudos (giver_id);

-- -----------------------------------------------------------------------------
-- updated_at
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TRIGGER trg_employee_skills_updated_at
  BEFORE UPDATE ON public.employee_skills
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TRIGGER trg_objectives_updated_at
  BEFORE UPDATE ON public.objectives
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TRIGGER trg_key_results_updated_at
  BEFORE UPDATE ON public.key_results
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TRIGGER trg_one_on_ones_updated_at
  BEFORE UPDATE ON public.one_on_ones
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TRIGGER trg_agenda_notes_updated_at
  BEFORE UPDATE ON public.one_on_one_agenda_notes
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TRIGGER trg_action_items_updated_at
  BEFORE UPDATE ON public.action_items
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- -----------------------------------------------------------------------------
-- Auth signup → profile (fail closed: employee, no department until assigned)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'employee'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- -----------------------------------------------------------------------------
-- RLS helpers (SECURITY DEFINER, scoped to auth.uid() only)
-- Must live in public, SET search_path = public, never take a target user id
-- to return that user's role unless the caller is also authorized.
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'super_admin'
      AND p.is_active
  );
$$;

CREATE OR REPLACE FUNCTION public.is_manager()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'manager'
      AND p.is_active
  );
$$;

CREATE OR REPLACE FUNCTION public.profile_department_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.department_id
  FROM public.profiles p
  WHERE p.id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_hr_for_department(p_department_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p_department_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.department_hr_assignments a
      JOIN public.profiles p ON p.id = a.user_id
      WHERE a.user_id = auth.uid()
        AND a.department_id = p_department_id
        AND p.role = 'hr'
        AND p.is_active
    );
$$;

CREATE OR REPLACE FUNCTION public.hr_assigned_department_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT a.department_id
  FROM public.department_hr_assignments a
  JOIN public.profiles p ON p.id = a.user_id
  WHERE a.user_id = auth.uid()
    AND p.role = 'hr'
    AND p.is_active;
$$;

CREATE OR REPLACE FUNCTION public.can_view_performance_of(p_employee_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    auth.uid() IS NOT NULL
    AND p_employee_id IS NOT NULL
    AND (
      auth.uid() = p_employee_id
      OR public.is_super_admin()
      OR EXISTS (
        SELECT 1
        FROM public.profiles t
        WHERE t.id = p_employee_id
          AND t.is_active
          AND public.is_hr_for_department(t.department_id)
      )
      OR EXISTS (
        SELECT 1
        FROM public.profiles me
        JOIN public.profiles t ON t.id = p_employee_id
        WHERE me.id = auth.uid()
          AND me.role = 'manager'
          AND me.is_active
          AND t.manager_id = me.id
          AND t.department_id IS NOT NULL
          AND t.department_id = me.department_id
      )
    );
$$;

-- HRIS field edits: self (limited by trigger), assigned HR, super_admin.
-- Managers do not edit profile rows; they edit performance tables.
CREATE OR REPLACE FUNCTION public.can_manage_profile(p_employee_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    auth.uid() IS NOT NULL
    AND p_employee_id IS NOT NULL
    AND (
      auth.uid() = p_employee_id
      OR public.is_super_admin()
      OR EXISTS (
        SELECT 1
        FROM public.profiles t
        WHERE t.id = p_employee_id
          AND public.is_hr_for_department(t.department_id)
      )
    );
$$;

CREATE OR REPLACE FUNCTION public.can_access_one_on_one(p_one_on_one_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.one_on_ones o
    WHERE o.id = p_one_on_one_id
      AND (
        public.is_super_admin()
        OR public.is_hr_for_department(o.department_id)
        OR o.employee_id = auth.uid()
        OR o.manager_id = auth.uid()
      )
  );
$$;

-- -----------------------------------------------------------------------------
-- Integrity triggers: department_id is always copied from the subject employee.
-- Client-supplied silo ids are overwritten, never trusted.
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.tg_stamp_employee_department()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  subj_dept uuid;
  subj_active boolean;
BEGIN
  SELECT p.department_id, p.is_active
    INTO subj_dept, subj_active
  FROM public.profiles p
  WHERE p.id = NEW.employee_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'employee_id % does not exist', NEW.employee_id
      USING ERRCODE = '23503';
  END IF;

  IF subj_dept IS NULL THEN
    RAISE EXCEPTION 'employee % has no department_id; cannot write siloed data', NEW.employee_id
      USING ERRCODE = '23514';
  END IF;

  IF TG_TABLE_NAME = 'one_on_ones' THEN
    IF NOT EXISTS (
      SELECT 1
      FROM public.profiles m
      WHERE m.id = NEW.manager_id
        AND m.department_id = subj_dept
    ) THEN
      RAISE EXCEPTION 'manager must belong to the same department as the employee'
        USING ERRCODE = '23514';
    END IF;
  END IF;

  NEW.department_id := subj_dept;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_objectives_stamp_dept
  BEFORE INSERT OR UPDATE OF employee_id, department_id ON public.objectives
  FOR EACH ROW EXECUTE FUNCTION public.tg_stamp_employee_department();

CREATE TRIGGER trg_employee_skills_stamp_dept
  BEFORE INSERT OR UPDATE OF employee_id, department_id ON public.employee_skills
  FOR EACH ROW EXECUTE FUNCTION public.tg_stamp_employee_department();

CREATE TRIGGER trg_one_on_ones_stamp_dept
  BEFORE INSERT OR UPDATE OF employee_id, manager_id, department_id ON public.one_on_ones
  FOR EACH ROW EXECUTE FUNCTION public.tg_stamp_employee_department();

CREATE OR REPLACE FUNCTION public.tg_stamp_key_result_department()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  obj public.objectives%ROWTYPE;
BEGIN
  SELECT * INTO obj FROM public.objectives WHERE id = NEW.objective_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'objective % does not exist', NEW.objective_id
      USING ERRCODE = '23503';
  END IF;
  NEW.employee_id := obj.employee_id;
  NEW.department_id := obj.department_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_key_results_stamp_dept
  BEFORE INSERT OR UPDATE OF objective_id, employee_id, department_id ON public.key_results
  FOR EACH ROW EXECUTE FUNCTION public.tg_stamp_key_result_department();

CREATE OR REPLACE FUNCTION public.tg_touch_objective_progress()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.objectives
  SET last_progress_at = now()
  WHERE id = NEW.objective_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_key_results_touch_objective
  AFTER INSERT OR UPDATE OF current_value, progress_pct ON public.key_results
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_objective_progress();

CREATE OR REPLACE FUNCTION public.tg_stamp_ooo_child_department()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ooo public.one_on_ones%ROWTYPE;
BEGIN
  SELECT * INTO ooo FROM public.one_on_ones WHERE id = NEW.one_on_one_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'one_on_one % does not exist', NEW.one_on_one_id
      USING ERRCODE = '23503';
  END IF;
  NEW.department_id := ooo.department_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_agenda_notes_stamp_dept
  BEFORE INSERT OR UPDATE OF one_on_one_id, department_id ON public.one_on_one_agenda_notes
  FOR EACH ROW EXECUTE FUNCTION public.tg_stamp_ooo_child_department();

CREATE TRIGGER trg_action_items_stamp_dept
  BEFORE INSERT OR UPDATE OF one_on_one_id, department_id ON public.action_items
  FOR EACH ROW EXECUTE FUNCTION public.tg_stamp_ooo_child_department();

CREATE OR REPLACE FUNCTION public.tg_stamp_kudos_department()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  giver public.profiles%ROWTYPE;
  recip public.profiles%ROWTYPE;
BEGIN
  SELECT * INTO giver FROM public.profiles WHERE id = NEW.giver_id;
  SELECT * INTO recip FROM public.profiles WHERE id = NEW.recipient_id;

  IF giver.id IS NULL OR recip.id IS NULL THEN
    RAISE EXCEPTION 'kudos giver and recipient must exist' USING ERRCODE = '23503';
  END IF;

  IF NOT giver.is_active OR NOT recip.is_active THEN
    RAISE EXCEPTION 'kudos participants must be active' USING ERRCODE = '23514';
  END IF;

  IF giver.department_id IS NULL
     OR recip.department_id IS NULL
     OR giver.department_id IS DISTINCT FROM recip.department_id THEN
    RAISE EXCEPTION 'kudos must stay inside a single department'
      USING ERRCODE = '23514';
  END IF;

  NEW.department_id := recip.department_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_kudos_stamp_dept
  BEFORE INSERT OR UPDATE OF giver_id, recipient_id, department_id ON public.kudos
  FOR EACH ROW EXECUTE FUNCTION public.tg_stamp_kudos_department();

CREATE OR REPLACE FUNCTION public.tg_protect_profile_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  mgr_dept uuid;
BEGIN
  -- Bootstrap / service_role / SQL editor: no JWT. RLS still blocks
  -- authenticated clients because can_manage_profile requires auth.uid().
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.id IS DISTINCT FROM OLD.id THEN
    RAISE EXCEPTION 'profiles.id is immutable' USING ERRCODE = '42501';
  END IF;

  IF NEW.email IS DISTINCT FROM OLD.email THEN
    RAISE EXCEPTION 'profiles.email is immutable from the client' USING ERRCODE = '42501';
  END IF;

  IF NEW.manager_id IS NOT NULL THEN
    SELECT department_id INTO mgr_dept FROM public.profiles WHERE id = NEW.manager_id;
    IF mgr_dept IS DISTINCT FROM NEW.department_id THEN
      RAISE EXCEPTION 'manager_id must reference a user in the same department'
        USING ERRCODE = '23514';
    END IF;
  END IF;

  IF public.is_super_admin() THEN
    RETURN NEW;
  END IF;

  -- Assigned HR: may change manager_id, is_active, title, hired_at inside the silo.
  -- Cannot change role or move departments (that is SuperAdmin-only).
  IF public.is_hr_for_department(OLD.department_id)
     AND (NEW.department_id IS NOT DISTINCT FROM OLD.department_id)
  THEN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'only super_admin may change role' USING ERRCODE = '42501';
    END IF;
    RETURN NEW;
  END IF;

  -- Self-service: identity fields only.
  IF auth.uid() = OLD.id THEN
    NEW.role := OLD.role;
    NEW.department_id := OLD.department_id;
    NEW.manager_id := OLD.manager_id;
    NEW.is_active := OLD.is_active;
    NEW.hired_at := OLD.hired_at;
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'not allowed to update this profile' USING ERRCODE = '42501';
END;
$$;

CREATE TRIGGER trg_protect_profile_columns
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.tg_protect_profile_columns();

CREATE OR REPLACE FUNCTION public.tg_hr_assignment_must_be_hr()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = NEW.user_id AND p.role = 'hr'
  ) THEN
    RAISE EXCEPTION 'department_hr_assignments.user_id must have role hr'
      USING ERRCODE = '23514';
  END IF;
  IF auth.uid() IS NOT NULL THEN
    NEW.assigned_by := COALESCE(NEW.assigned_by, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_hr_assignment_must_be_hr
  BEFORE INSERT OR UPDATE ON public.department_hr_assignments
  FOR EACH ROW EXECUTE FUNCTION public.tg_hr_assignment_must_be_hr();

-- -----------------------------------------------------------------------------
-- Enable RLS (FORCE so table owners cannot accidentally bypass via views they own
-- when queried as authenticated — policies still apply to non-owner roles).
-- -----------------------------------------------------------------------------

ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments FORCE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE public.department_hr_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.department_hr_assignments FORCE ROW LEVEL SECURITY;
ALTER TABLE public.skill_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_catalog FORCE ROW LEVEL SECURITY;
ALTER TABLE public.employee_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_skills FORCE ROW LEVEL SECURITY;
ALTER TABLE public.objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.objectives FORCE ROW LEVEL SECURITY;
ALTER TABLE public.key_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.key_results FORCE ROW LEVEL SECURITY;
ALTER TABLE public.one_on_ones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.one_on_ones FORCE ROW LEVEL SECURITY;
ALTER TABLE public.one_on_one_agenda_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.one_on_one_agenda_notes FORCE ROW LEVEL SECURITY;
ALTER TABLE public.action_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_items FORCE ROW LEVEL SECURITY;
ALTER TABLE public.kudos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kudos FORCE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- Policies: departments
-- -----------------------------------------------------------------------------

CREATE POLICY departments_select ON public.departments
  FOR SELECT TO authenticated
  USING (
    public.is_super_admin()
    OR id = public.profile_department_id()
    OR public.is_hr_for_department(id)
  );

CREATE POLICY departments_write_admin ON public.departments
  FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- -----------------------------------------------------------------------------
-- Policies: profiles
-- Employees cannot SELECT peer profile rows (manager_id, hired_at, role leak).
-- Directory lookup is the SECURITY DEFINER view below.
-- -----------------------------------------------------------------------------

CREATE POLICY profiles_select_self ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY profiles_select_hr ON public.profiles
  FOR SELECT TO authenticated
  USING (public.is_hr_for_department(department_id));

CREATE POLICY profiles_select_manager_reports ON public.profiles
  FOR SELECT TO authenticated
  USING (
    public.is_manager()
    AND manager_id = auth.uid()
    AND department_id IS NOT NULL
    AND department_id = public.profile_department_id()
  );

CREATE POLICY profiles_select_super_admin ON public.profiles
  FOR SELECT TO authenticated
  USING (public.is_super_admin());

CREATE POLICY profiles_update_manage ON public.profiles
  FOR UPDATE TO authenticated
  USING (public.can_manage_profile(id))
  WITH CHECK (public.can_manage_profile(id));

-- No client INSERT/DELETE on profiles (signup trigger + ON DELETE CASCADE from auth.users).

-- -----------------------------------------------------------------------------
-- Policies: department_hr_assignments
-- -----------------------------------------------------------------------------

CREATE POLICY hr_assignments_select ON public.department_hr_assignments
  FOR SELECT TO authenticated
  USING (
    public.is_super_admin()
    OR user_id = auth.uid()
  );

CREATE POLICY hr_assignments_write_admin ON public.department_hr_assignments
  FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- -----------------------------------------------------------------------------
-- Policies: skill_catalog (names are not siloed; writes are SuperAdmin)
-- -----------------------------------------------------------------------------

CREATE POLICY skill_catalog_select ON public.skill_catalog
  FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY skill_catalog_write_admin ON public.skill_catalog
  FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- -----------------------------------------------------------------------------
-- Shared performance-table policies (subject = employee_id)
-- -----------------------------------------------------------------------------

CREATE POLICY employee_skills_select ON public.employee_skills
  FOR SELECT TO authenticated
  USING (public.can_view_performance_of(employee_id));

CREATE POLICY employee_skills_insert ON public.employee_skills
  FOR INSERT TO authenticated
  WITH CHECK (public.can_view_performance_of(employee_id));

CREATE POLICY employee_skills_update ON public.employee_skills
  FOR UPDATE TO authenticated
  USING (public.can_view_performance_of(employee_id))
  WITH CHECK (public.can_view_performance_of(employee_id));

CREATE POLICY employee_skills_delete ON public.employee_skills
  FOR DELETE TO authenticated
  USING (
    public.is_super_admin()
    OR public.is_hr_for_department(department_id)
    OR employee_id = auth.uid()
  );

CREATE POLICY objectives_select ON public.objectives
  FOR SELECT TO authenticated
  USING (public.can_view_performance_of(employee_id));

CREATE POLICY objectives_insert ON public.objectives
  FOR INSERT TO authenticated
  WITH CHECK (public.can_view_performance_of(employee_id));

CREATE POLICY objectives_update ON public.objectives
  FOR UPDATE TO authenticated
  USING (public.can_view_performance_of(employee_id))
  WITH CHECK (public.can_view_performance_of(employee_id));

CREATE POLICY objectives_delete ON public.objectives
  FOR DELETE TO authenticated
  USING (
    public.is_super_admin()
    OR public.is_hr_for_department(department_id)
    OR employee_id = auth.uid()
  );

CREATE POLICY key_results_select ON public.key_results
  FOR SELECT TO authenticated
  USING (public.can_view_performance_of(employee_id));

CREATE POLICY key_results_insert ON public.key_results
  FOR INSERT TO authenticated
  WITH CHECK (public.can_view_performance_of(employee_id));

CREATE POLICY key_results_update ON public.key_results
  FOR UPDATE TO authenticated
  USING (public.can_view_performance_of(employee_id))
  WITH CHECK (public.can_view_performance_of(employee_id));

CREATE POLICY key_results_delete ON public.key_results
  FOR DELETE TO authenticated
  USING (
    public.is_super_admin()
    OR public.is_hr_for_department(department_id)
    OR employee_id = auth.uid()
  );

-- -----------------------------------------------------------------------------
-- Policies: 1-to-1 cycle
-- -----------------------------------------------------------------------------

CREATE POLICY one_on_ones_select ON public.one_on_ones
  FOR SELECT TO authenticated
  USING (
    public.is_super_admin()
    OR public.is_hr_for_department(department_id)
    OR employee_id = auth.uid()
    OR manager_id = auth.uid()
  );

CREATE POLICY one_on_ones_insert ON public.one_on_ones
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_super_admin()
    OR public.is_hr_for_department(department_id)
    OR (
      employee_id = auth.uid()
      AND manager_id = (SELECT me.manager_id FROM public.profiles me WHERE me.id = auth.uid())
    )
    OR (
      manager_id = auth.uid()
      AND public.can_view_performance_of(employee_id)
    )
  );

CREATE POLICY one_on_ones_update ON public.one_on_ones
  FOR UPDATE TO authenticated
  USING (
    public.is_super_admin()
    OR public.is_hr_for_department(department_id)
    OR employee_id = auth.uid()
    OR manager_id = auth.uid()
  )
  WITH CHECK (
    public.is_super_admin()
    OR public.is_hr_for_department(department_id)
    OR employee_id = auth.uid()
    OR manager_id = auth.uid()
  );

CREATE POLICY one_on_ones_delete ON public.one_on_ones
  FOR DELETE TO authenticated
  USING (
    public.is_super_admin()
    OR public.is_hr_for_department(department_id)
    OR manager_id = auth.uid()
  );

CREATE POLICY agenda_notes_select ON public.one_on_one_agenda_notes
  FOR SELECT TO authenticated
  USING (public.can_access_one_on_one(one_on_one_id));

CREATE POLICY agenda_notes_insert ON public.one_on_one_agenda_notes
  FOR INSERT TO authenticated
  WITH CHECK (
    public.can_access_one_on_one(one_on_one_id)
    AND author_id = auth.uid()
  );

CREATE POLICY agenda_notes_update ON public.one_on_one_agenda_notes
  FOR UPDATE TO authenticated
  USING (author_id = auth.uid() AND public.can_access_one_on_one(one_on_one_id))
  WITH CHECK (author_id = auth.uid() AND public.can_access_one_on_one(one_on_one_id));

CREATE POLICY agenda_notes_delete ON public.one_on_one_agenda_notes
  FOR DELETE TO authenticated
  USING (
    author_id = auth.uid()
    OR public.is_super_admin()
    OR public.is_hr_for_department(department_id)
  );

CREATE POLICY action_items_select ON public.action_items
  FOR SELECT TO authenticated
  USING (
    public.can_access_one_on_one(one_on_one_id)
    OR assignee_id = auth.uid()
  );

CREATE POLICY action_items_insert ON public.action_items
  FOR INSERT TO authenticated
  WITH CHECK (public.can_access_one_on_one(one_on_one_id));

CREATE POLICY action_items_update ON public.action_items
  FOR UPDATE TO authenticated
  USING (
    public.can_access_one_on_one(one_on_one_id)
    OR assignee_id = auth.uid()
  )
  WITH CHECK (
    public.can_access_one_on_one(one_on_one_id)
    OR assignee_id = auth.uid()
  );

CREATE POLICY action_items_delete ON public.action_items
  FOR DELETE TO authenticated
  USING (
    public.is_super_admin()
    OR public.is_hr_for_department(department_id)
    OR public.can_access_one_on_one(one_on_one_id)
  );

-- -----------------------------------------------------------------------------
-- Policies: kudos (continuous dept feed; insert same-department only)
-- -----------------------------------------------------------------------------

CREATE POLICY kudos_select ON public.kudos
  FOR SELECT TO authenticated
  USING (
    public.is_super_admin()
    OR public.is_hr_for_department(department_id)
    OR department_id = public.profile_department_id()
  );

CREATE POLICY kudos_insert ON public.kudos
  FOR INSERT TO authenticated
  WITH CHECK (
    giver_id = auth.uid()
    AND department_id = public.profile_department_id()
  );

CREATE POLICY kudos_delete ON public.kudos
  FOR DELETE TO authenticated
  USING (
    giver_id = auth.uid()
    OR public.is_super_admin()
    OR public.is_hr_for_department(department_id)
  );

-- -----------------------------------------------------------------------------
-- Colleague directory (name/title only). SECURITY DEFINER so employees can
-- resolve peers for the Kudos board without reading profiles RLS (which
-- hides manager_id / hired_at / role).
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.list_colleague_directory()
RETURNS TABLE (
  id uuid,
  full_name text,
  title text,
  avatar_url text,
  department_id uuid
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.full_name, p.title, p.avatar_url, p.department_id
  FROM public.profiles p
  WHERE p.is_active
    AND p.department_id IS NOT NULL
    AND (
      public.is_super_admin()
      OR p.department_id = public.profile_department_id()
      OR public.is_hr_for_department(p.department_id)
    );
$$;

CREATE OR REPLACE VIEW public.colleague_directory
WITH (security_invoker = true)
AS
  SELECT * FROM public.list_colleague_directory();

COMMENT ON VIEW public.colleague_directory IS
  'Limited colleague lookup for Kudos tagging. Does not expose role, manager_id, or hired_at.';

-- -----------------------------------------------------------------------------
-- HR-only aggregates (return privilege error unless assigned to that silo)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.assert_hr_department(p_department_id uuid)
RETURNS void
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_department_id IS NULL THEN
    RAISE EXCEPTION 'department_id is required' USING ERRCODE = '22023';
  END IF;
  IF NOT (public.is_super_admin() OR public.is_hr_for_department(p_department_id)) THEN
    RAISE EXCEPTION 'not authorized for department' USING ERRCODE = '42501';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.hr_flight_risk_radar(p_department_id uuid)
RETURNS TABLE (
  employee_id uuid,
  full_name text,
  title text,
  days_since_last_one_on_one integer,
  stalled_goal_count bigint,
  reasons text[]
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.assert_hr_department(p_department_id);

  RETURN QUERY
  WITH last_ooo AS (
    SELECT
      o.employee_id,
      max(o.completed_at) AS last_completed_at
    FROM public.one_on_ones o
    WHERE o.department_id = p_department_id
      AND o.status = 'completed'
      AND o.completed_at IS NOT NULL
    GROUP BY o.employee_id
  ),
  stalled AS (
    SELECT
      obj.employee_id,
      count(*) AS stalled_count
    FROM public.objectives obj
    WHERE obj.department_id = p_department_id
      AND obj.status IN ('active', 'stalled')
      AND (
        obj.status = 'stalled'
        OR obj.last_progress_at IS NULL
        OR obj.last_progress_at < now() - interval '30 days'
      )
    GROUP BY obj.employee_id
  )
  SELECT
    p.id,
    p.full_name,
    p.title,
    CASE
      WHEN lo.last_completed_at IS NULL THEN
        GREATEST(0, (CURRENT_DATE - COALESCE(p.hired_at, p.created_at::date)))
      ELSE
        GREATEST(0, (now()::date - lo.last_completed_at::date))
    END::integer AS days_since_last_one_on_one,
    COALESCE(s.stalled_count, 0) AS stalled_goal_count,
    array_remove(ARRAY[
      CASE
        WHEN p.hired_at IS NOT NULL AND p.hired_at > CURRENT_DATE - 60 THEN NULL
        WHEN lo.last_completed_at IS NULL
          OR lo.last_completed_at < now() - interval '60 days'
        THEN 'no_one_on_one_60d'
      END,
      CASE WHEN COALESCE(s.stalled_count, 0) > 0 THEN 'stalled_goals' END
    ], NULL) AS reasons
  FROM public.profiles p
  LEFT JOIN last_ooo lo ON lo.employee_id = p.id
  LEFT JOIN stalled s ON s.employee_id = p.id
  WHERE p.department_id = p_department_id
    AND p.is_active
    AND p.role IN ('employee', 'manager', 'hr')
    AND (
      (
        (p.hired_at IS NULL OR p.hired_at <= CURRENT_DATE - 60)
        AND (lo.last_completed_at IS NULL OR lo.last_completed_at < now() - interval '60 days')
      )
      OR COALESCE(s.stalled_count, 0) > 0
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.hr_skills_heatmap(p_department_id uuid)
RETURNS TABLE (
  skill_id uuid,
  skill_slug text,
  skill_name text,
  avg_proficiency numeric,
  rated_employee_count bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.assert_hr_department(p_department_id);

  RETURN QUERY
  SELECT
    sc.id,
    sc.slug,
    sc.name,
    round(avg(es.proficiency)::numeric, 2) AS avg_proficiency,
    count(DISTINCT es.employee_id) AS rated_employee_count
  FROM public.skill_catalog sc
  LEFT JOIN public.employee_skills es
    ON es.skill_id = sc.id
   AND es.department_id = p_department_id
  GROUP BY sc.id, sc.slug, sc.name, sc.sort_order
  ORDER BY sc.sort_order, sc.name;
END;
$$;

CREATE OR REPLACE FUNCTION public.hr_dashboard_metrics(p_department_id uuid)
RETURNS TABLE (
  active_headcount bigint,
  pending_one_on_ones bigint,
  active_objectives bigint,
  stalled_objectives bigint,
  kudos_last_30d bigint,
  flight_risk_count bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.assert_hr_department(p_department_id);

  RETURN QUERY
  SELECT
    (SELECT count(*) FROM public.profiles p
      WHERE p.department_id = p_department_id AND p.is_active) AS active_headcount,
    (SELECT count(*) FROM public.one_on_ones o
      WHERE o.department_id = p_department_id AND o.status IN ('scheduled', 'in_progress')) AS pending_one_on_ones,
    (SELECT count(*) FROM public.objectives obj
      WHERE obj.department_id = p_department_id AND obj.status = 'active') AS active_objectives,
    (SELECT count(*) FROM public.objectives obj
      WHERE obj.department_id = p_department_id AND obj.status = 'stalled') AS stalled_objectives,
    (SELECT count(*) FROM public.kudos k
      WHERE k.department_id = p_department_id AND k.created_at >= now() - interval '30 days') AS kudos_last_30d,
    (SELECT count(*) FROM public.hr_flight_risk_radar(p_department_id)) AS flight_risk_count;
END;
$$;

-- Annual review portfolio = kudos received (already siloed by kudos RLS).
CREATE OR REPLACE VIEW public.kudos_review_portfolio
WITH (security_invoker = true) AS
  SELECT
    k.recipient_id AS employee_id,
    k.department_id,
    k.id AS kudos_id,
    k.giver_id,
    k.body,
    k.tags,
    k.created_at
  FROM public.kudos k;

-- -----------------------------------------------------------------------------
-- Grants: fail closed for anon / PUBLIC
-- -----------------------------------------------------------------------------

REVOKE ALL ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO postgres, service_role, authenticated;

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM PUBLIC, anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM PUBLIC, anon;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC, anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON
  public.departments,
  public.profiles,
  public.department_hr_assignments,
  public.skill_catalog,
  public.employee_skills,
  public.objectives,
  public.key_results,
  public.one_on_ones,
  public.one_on_one_agenda_notes,
  public.action_items,
  public.kudos
TO authenticated;

GRANT SELECT ON public.colleague_directory TO authenticated;
GRANT SELECT ON public.kudos_review_portfolio TO authenticated;

REVOKE INSERT, DELETE ON public.profiles FROM authenticated;

GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_manager() TO authenticated;
GRANT EXECUTE ON FUNCTION public.profile_department_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_hr_for_department(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.hr_assigned_department_ids() TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_view_performance_of(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_manage_profile(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_one_on_one(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_colleague_directory() TO authenticated;
GRANT EXECUTE ON FUNCTION public.hr_flight_risk_radar(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.hr_skills_heatmap(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.hr_dashboard_metrics(uuid) TO authenticated;

-- service_role bypasses RLS (Supabase default). Never ship that key to the browser.
