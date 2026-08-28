# Suii Performance Management System

Next.js App Router + Tailwind + TypeScript, with **Clerk** for identity and **Supabase Postgres** for data and RLS.

Until Clerk/Supabase keys are set, the app runs a demo workspace that mirrors the same access rules (employees see their own goals/reviews; managers see direct reports).

## Core features

1. **Cascading OKRs & goal approval** — draft → submit → manager approve/reject; statuses Not started / In progress / Achieved
2. **1:1 review cycles** — self-appraisal then manager assessment on the same cycle
3. **Flight Risk Radar** — manager view of goal completion, missed check-ins, pending reviews
4. **360° Kudos board** — public recognition feed
5. **Skills heatmap** — levels vs role benchmarks

## Supabase schema

Apply in the Supabase SQL editor (in order):

1. `supabase/schema.sql` — tables, helpers, RLS
2. `supabase/seed.sql` — demo org (optional)

Then:

1. In Clerk, activate the **Supabase** integration (adds `role: authenticated` to session tokens).
2. In Supabase, **Authentication → Sign In / Providers → Clerk**, paste your Clerk domain.
3. Do **not** use `auth.uid()` in policies. Clerk ids are text. Policies use `(select auth.jwt() ->> 'sub')`.

## Environment

```bash
cp .env.example .env.local
```

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk |
| `CLERK_SECRET_KEY` | Clerk |
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Anon / publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Clerk webhook profile sync |
| `CLERK_WEBHOOK_SECRET` | Optional Svix verification |

Point a Clerk webhook at `/api/webhooks/clerk` for `user.created` / `user.updated`.

```bash
npm install
npm run dev
```

Open http://localhost:3000. Demo accounts (no password): Priya (admin), Marcus/Maya (managers), Aisha/Samir/Leo/Jordan (ICs).
