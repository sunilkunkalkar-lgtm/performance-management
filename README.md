# Suii Performance Management System

A secure, 3-role task management app with individual email/password credentials and role-isolated dashboards.

```bash
npm install
npm run dev
```

Open http://localhost:3000 and sign in with one of the demo accounts below.

Mock data is stored in `.data/pms-demo.json`. Use **Reset mock data** in the sidebar to restore the seed.

## Demo accounts

| Role | Email | Password |
|------|-------|----------|
| Boss | boss@suii.app | boss123 |
| HR | hr@suii.app | hr123 |
| Employee | aisha@suii.app | employee123 |
| Employee | samir@suii.app | employee123 |
| Employee | leo@suii.app | employee123 |

## Role dashboards

- **Boss** (`/dashboard/boss`) — create/assign tasks, live progress board, review completed work
- **HR** (`/dashboard/hr`) — employee CRUD, task distribution, productivity scorecards (read-only tasks)
- **Employee** (`/dashboard/employee`) — own tasks only; update status, flag blockers, send progress comments

## Signature features

1. **Flag Blocker** — employees can flag tasks; Boss & HR see a prominent "Needs attention" alert
2. **Executive Summary Card** — active tasks, completion %, and blocker count on Boss & HR dashboards

## Later: Clerk + Supabase

Set `AUTH_MODE=clerk` and add keys from `.env.example`. Apply `supabase/schema.sql` then `supabase/seed.sql`.
