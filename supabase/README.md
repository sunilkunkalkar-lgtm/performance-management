# Supabase

1. Run `schema.sql` in the SQL editor.
2. Optionally run `seed.sql`.
3. Enable Clerk as a third-party auth provider in **both** Clerk and Supabase dashboards.
4. Set `SUPABASE_SERVICE_ROLE_KEY` in the app — seeded `profiles.clerk_id` values are placeholders until a user signs in; the service role links the real Clerk id by email.
5. RLS helpers:

- `current_clerk_id()` → `auth.jwt() ->> 'sub'`
- `current_employee_id()`, `is_manager_of()`, `can_access_employee()`, `is_admin()`

Do not use `auth.uid()` with Clerk; Clerk user ids are not UUIDs.
