# Suii Performance Management System

Suii is a demo performance management workspace: goals, review cycles, manager calibration, feedback, and team health — with role-based access for people partners, managers, and employees.

This repository is the working copy of the product. The companion GitHub repo name `suii-Performance-Management-System-` is the same product.

## Features

- **Sign-in** with demo accounts (People admin, managers, ICs)
- **Overview** of goals, open reviews, and recent feedback
- **Goals** with metrics, progress updates, and status
- **Reviews** with self-assessment, competency scores, and manager write-up
- **Feedback** given and received
- **People directory** and **team** coaching view
- **Cycles** and a **reports** snapshot for the active cycle

## Setup

```bash
cp .env.example .env
npm install
npm run db:setup
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Demo accounts

Password for every account: `suii123`

| Email | Role |
| --- | --- |
| priya@suii.app | Head of People (admin) |
| marcus@suii.app | Engineering manager |
| maya@suii.app | Design manager |
| aisha@suii.app | Senior engineer |
| samir@suii.app | Engineer |
| leo@suii.app | Designer |
| jordan@suii.app | Product manager |

## Stack

Next.js (App Router), TypeScript, Tailwind CSS, Prisma, SQLite.
