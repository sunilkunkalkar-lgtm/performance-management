# Supabase

1. Run `schema.sql` in the SQL editor.
2. Optionally run `seed.sql`.
3. Enable Clerk as a third-party auth provider.
4. RLS helpers:

- `current_clerk_id()` → `auth.jwt() ->> 'sub'`
- `current_employee_id()`, `is_manager_of()`, `can_access_employee()`, `is_admin()`

Do not use `auth.uid()` with Clerk; Clerk user ids are not UUIDs.
