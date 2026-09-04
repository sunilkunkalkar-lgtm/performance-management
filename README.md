# Suii Performance Management System

The app is set up for **local demo mode**: mock org data and cookie authentication. Clerk and Supabase are not required.

```bash
npm install
npm run dev
```

Open http://localhost:3000 and click a persona (Aisha = IC, Marcus = manager, Priya = admin).

Mock data is stored in `.data/pms-demo.json` so changes survive restarts. Use **Reset mock data** in the sidebar to restore the seed.

## Features you can test

1. Cascading OKRs with manager approval
2. 1:1 self-appraisal and manager review
3. Flight Risk Radar (managers)
4. 360° kudos board
5. Skills heatmap vs role benchmarks

Access rules match the planned RLS: employees see their own goals/reviews; managers see direct reports.

## Later: Clerk + Supabase

Set `AUTH_MODE=clerk` and add keys from `.env.example`. Apply `supabase/schema.sql` then `supabase/seed.sql`.

When both Clerk and Supabase env vars are set, the app reads and writes through Supabase (with RLS) instead of the local JSON file. TypeScript types for the database live in `src/lib/supabase/database.types.ts`; row mappers in `src/lib/supabase/mappers.ts` convert snake_case columns to the app’s camelCase types in `src/lib/pms/types.ts`.
