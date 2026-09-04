import { hashPassword } from "@/lib/auth/password";
import type { Employee, Person, Profile, Result, Task, TaskComment } from "./types";

export type Db = {
  profiles: Profile[];
  employees: Employee[];
  tasks: Task[];
  taskComments: TaskComment[];
};

const P = {
  boss: "11111111-1111-1111-1111-111111111111",
  hr: "22222222-2222-2222-2222-222222222222",
  aisha: "33333333-3333-3333-3333-333333333333",
  samir: "44444444-4444-4444-4444-444444444444",
  leo: "55555555-5555-5555-5555-555555555555",
};

const E = {
  boss: "a1111111-1111-1111-1111-111111111111",
  hr: "a2222222-2222-2222-2222-222222222222",
  aisha: "a3333333-3333-3333-3333-333333333333",
  samir: "a4444444-4444-4444-4444-444444444444",
  leo: "a5555555-5555-5555-5555-555555555555",
};

export const SEED_CREDENTIALS = [
  { email: "boss@suii.app", password: "boss123", label: "Boss" },
  { email: "hr@suii.app", password: "hr123", label: "HR" },
  { email: "aisha@suii.app", password: "employee123", label: "Employee" },
  { email: "samir@suii.app", password: "employee123", label: "Employee" },
  { email: "leo@suii.app", password: "employee123", label: "Employee" },
] as const;

export function seedDb(): Db {
  const now = new Date().toISOString();
  const week = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  const twoWeeks = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);

  return {
    profiles: [
      {
        id: P.boss,
        clerkId: "user_boss",
        email: "boss@suii.app",
        fullName: "Alex Morgan",
        role: "boss",
        passwordHash: hashPassword("boss123"),
        avatarUrl: null,
      },
      {
        id: P.hr,
        clerkId: "user_hr",
        email: "hr@suii.app",
        fullName: "Priya Nair",
        role: "hr",
        passwordHash: hashPassword("hr123"),
        avatarUrl: null,
      },
      {
        id: P.aisha,
        clerkId: "user_aisha",
        email: "aisha@suii.app",
        fullName: "Aisha Rahman",
        role: "employee",
        passwordHash: hashPassword("employee123"),
        avatarUrl: null,
      },
      {
        id: P.samir,
        clerkId: "user_samir",
        email: "samir@suii.app",
        fullName: "Samir Joshi",
        role: "employee",
        passwordHash: hashPassword("employee123"),
        avatarUrl: null,
      },
      {
        id: P.leo,
        clerkId: "user_leo",
        email: "leo@suii.app",
        fullName: "Leo Park",
        role: "employee",
        passwordHash: hashPassword("employee123"),
        avatarUrl: null,
      },
    ],
    employees: [
      {
        id: E.boss,
        profileId: P.boss,
        managerId: null,
        title: "Chief Operating Officer",
        department: "Executive",
        jobRole: "Boss",
        hireDate: "2020-01-01",
      },
      {
        id: E.hr,
        profileId: P.hr,
        managerId: E.boss,
        title: "Head of People",
        department: "People",
        jobRole: "HR",
        hireDate: "2021-03-01",
      },
      {
        id: E.aisha,
        profileId: P.aisha,
        managerId: E.boss,
        title: "Senior Software Engineer",
        department: "Engineering",
        jobRole: "Engineer",
        hireDate: "2023-02-14",
      },
      {
        id: E.samir,
        profileId: P.samir,
        managerId: E.boss,
        title: "Software Engineer",
        department: "Engineering",
        jobRole: "Engineer",
        hireDate: "2024-04-01",
      },
      {
        id: E.leo,
        profileId: P.leo,
        managerId: E.boss,
        title: "Product Designer",
        department: "Design",
        jobRole: "Designer",
        hireDate: "2023-09-18",
      },
    ],
    tasks: [
      {
        id: "t1",
        title: "Ship reliability dashboard",
        description: "Build a live view of latency, error budget, and incident MTTR for production services.",
        assigneeId: E.aisha,
        createdById: E.boss,
        status: "in_progress",
        priority: "high",
        dueDate: week,
        isBlocked: false,
        completedAt: null,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "t2",
        title: "Reduce checkout API latency",
        description: "Profile hot paths and ship caching plus query improvements on checkout endpoints.",
        assigneeId: E.samir,
        createdById: E.boss,
        status: "not_started",
        priority: "medium",
        dueDate: twoWeeks,
        isBlocked: true,
        completedAt: null,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "t3",
        title: "Redesign employee task cards",
        description: "Improve clarity of status transitions and inline progress comments.",
        assigneeId: E.leo,
        createdById: E.boss,
        status: "completed",
        priority: "low",
        dueDate: week,
        isBlocked: false,
        completedAt: now,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "t4",
        title: "Document on-call runbook",
        description: "Shadow two incidents and publish an updated on-call playbook.",
        assigneeId: E.samir,
        createdById: E.boss,
        status: "in_progress",
        priority: "high",
        dueDate: week,
        isBlocked: false,
        completedAt: null,
        createdAt: now,
        updatedAt: now,
      },
    ],
    taskComments: [
      {
        id: "c1",
        taskId: "t1",
        authorId: E.aisha,
        body: "Dashboard shell is live. Wiring remaining service metrics today.",
        createdAt: now,
      },
      {
        id: "c2",
        taskId: "t2",
        authorId: E.samir,
        body: "Blocked waiting on staging access credentials from infra.",
        createdAt: now,
      },
      {
        id: "c3",
        taskId: "t3",
        authorId: E.leo,
        body: "Shipped updated card layout with inline comment box.",
        createdAt: now,
      },
    ],
  };
}

export function peopleOf(db: Db): Person[] {
  return db.employees.map((employee) => {
    const profile = db.profiles.find((p) => p.id === employee.profileId)!;
    return {
      ...employee,
      fullName: profile.fullName,
      email: profile.email,
      role: profile.role,
      clerkId: profile.clerkId,
    };
  });
}

export function actorFromClerkId(db: Db, clerkId: string): Person | null {
  return peopleOf(db).find((p) => p.clerkId === clerkId) ?? null;
}

export function ok<T>(data: T): Result<T> {
  return { data, error: null };
}

export function fail(error: string): Result<never> {
  return { data: null, error };
}
