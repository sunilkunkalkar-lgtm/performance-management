# Performance Management System (departmental HR)

Enterprise PMS for departmental HR. **Database schema and Row Level Security ship first.** There is no Next.js UI in this revision; the frontend must not be built until the silo policies in [`docs/DATABASE_SCHEMA.md`](docs/DATABASE_SCHEMA.md) are reviewed and applied.

## Apply the security contract

1. Run [`supabase/migrations/20260828120000_pms_schema_and_rls.sql`](supabase/migrations/20260828120000_pms_schema_and_rls.sql) (SQL Editor or `supabase db reset`).
2. Run [`supabase/seed.sql`](supabase/seed.sql) for Finance / Marketing / Logistics and the Finance skill catalog.
3. Run [`supabase/tests/rls_department_silo.sql`](supabase/tests/rls_department_silo.sql) on a non-production project.

Never expose the `service_role` key to the browser. RLS is the security boundary for `authenticated` clients.
