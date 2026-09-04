import { hashPassword } from "@/lib/auth/password";
import type { Employee, Person, Profile, Result, Task, TaskComment, TaskPriority, TaskStatus } from "./types";

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

type EmployeeSeed = {
  key: string;
  fullName: string;
  email: string;
  title: string;
  department: string;
  jobRole: string;
  hireDate: string;
};

const CORE_EMPLOYEES: EmployeeSeed[] = [
  {
    key: "aisha",
    fullName: "Aisha Rahman",
    email: "aisha@suii.app",
    title: "Senior Software Engineer",
    department: "Engineering",
    jobRole: "Engineer",
    hireDate: "2023-02-14",
  },
  {
    key: "samir",
    fullName: "Samir Joshi",
    email: "samir@suii.app",
    title: "Software Engineer",
    department: "Engineering",
    jobRole: "Engineer",
    hireDate: "2024-04-01",
  },
  {
    key: "leo",
    fullName: "Leo Park",
    email: "leo@suii.app",
    title: "Product Designer",
    department: "Design",
    jobRole: "Designer",
    hireDate: "2023-09-18",
  },
];

const EXTRA_EMPLOYEES: EmployeeSeed[] = [
  { key: "maya", fullName: "Maya Okonkwo", email: "maya@suii.app", title: "Senior Product Designer", department: "Design", jobRole: "Designer", hireDate: "2022-06-01" },
  { key: "jordan", fullName: "Jordan Hale", email: "jordan@suii.app", title: "Product Manager", department: "Product", jobRole: "Product Manager", hireDate: "2022-11-07" },
  { key: "nina", fullName: "Nina Patel", email: "nina@suii.app", title: "Backend Engineer", department: "Engineering", jobRole: "Engineer", hireDate: "2023-05-20" },
  { key: "carlos", fullName: "Carlos Ruiz", email: "carlos@suii.app", title: "Frontend Engineer", department: "Engineering", jobRole: "Engineer", hireDate: "2023-08-11" },
  { key: "emma", fullName: "Emma Wilson", email: "emma@suii.app", title: "Marketing Manager", department: "Marketing", jobRole: "Marketing", hireDate: "2021-09-15" },
  { key: "james", fullName: "James O'Brien", email: "james@suii.app", title: "Account Executive", department: "Sales", jobRole: "Sales", hireDate: "2022-03-22" },
  { key: "fatima", fullName: "Fatima Hassan", email: "fatima@suii.app", title: "Support Lead", department: "Support", jobRole: "Support", hireDate: "2021-12-01" },
  { key: "ryan", fullName: "Ryan Kim", email: "ryan@suii.app", title: "DevOps Engineer", department: "Engineering", jobRole: "Engineer", hireDate: "2023-01-09" },
  { key: "sofia", fullName: "Sofia Martinez", email: "sofia@suii.app", title: "UX Researcher", department: "Design", jobRole: "Designer", hireDate: "2024-02-05" },
  { key: "david", fullName: "David Chen", email: "david@suii.app", title: "Product Analyst", department: "Product", jobRole: "Product Manager", hireDate: "2023-11-18" },
  { key: "olivia", fullName: "Olivia Brown", email: "olivia@suii.app", title: "Recruiter", department: "People", jobRole: "People Partner", hireDate: "2022-08-30" },
  { key: "liam", fullName: "Liam Nguyen", email: "liam@suii.app", title: "QA Engineer", department: "Engineering", jobRole: "Engineer", hireDate: "2024-01-16" },
  { key: "hannah", fullName: "Hannah Lee", email: "hannah@suii.app", title: "Content Strategist", department: "Marketing", jobRole: "Marketing", hireDate: "2023-07-03" },
  { key: "marcus", fullName: "Marcus Vega", email: "marcus@suii.app", title: "Sales Development Rep", department: "Sales", jobRole: "Sales", hireDate: "2024-05-12" },
  { key: "zoe", fullName: "Zoe Anderson", email: "zoe@suii.app", title: "Customer Success Manager", department: "Support", jobRole: "Support", hireDate: "2022-10-24" },
  { key: "ethan", fullName: "Ethan Brooks", email: "ethan@suii.app", title: "Operations Coordinator", department: "Operations", jobRole: "Operations", hireDate: "2023-03-27" },
  { key: "priya-d", fullName: "Priya Desai", email: "priya.d@suii.app", title: "Mobile Engineer", department: "Engineering", jobRole: "Engineer", hireDate: "2023-12-08" },
  { key: "tom", fullName: "Tom Walker", email: "tom@suii.app", title: "Financial Analyst", department: "Finance", jobRole: "Finance", hireDate: "2022-04-19" },
  { key: "isla", fullName: "Isla Campbell", email: "isla@suii.app", title: "Visual Designer", department: "Design", jobRole: "Designer", hireDate: "2024-06-02" },
  { key: "arjun", fullName: "Arjun Mehta", email: "arjun@suii.app", title: "Data Engineer", department: "Engineering", jobRole: "Engineer", hireDate: "2023-10-10" },
];

const ALL_EMPLOYEES = [...CORE_EMPLOYEES, ...EXTRA_EMPLOYEES];

export const SEED_CREDENTIALS = [
  { email: "boss@suii.app", password: "boss123", label: "Boss" },
  { email: "hr@suii.app", password: "hr123", label: "HR" },
  ...ALL_EMPLOYEES.map((employee) => ({
    email: employee.email,
    password: "employee123",
    label: "Employee" as const,
  })),
] as const;

function profileId(index: number) {
  return `e1000000-0000-4000-8000-${String(index).padStart(12, "0")}`;
}

function employeeId(index: number) {
  return `e2000000-0000-4000-8000-${String(index).padStart(12, "0")}`;
}

function buildEmployeeRecords(
  seeds: EmployeeSeed[],
  startIndex: number,
  bossEmployeeId: string,
): { profiles: Profile[]; employees: Employee[]; idsByKey: Record<string, string> } {
  const passwordHash = hashPassword("employee123");
  const profiles: Profile[] = [];
  const employees: Employee[] = [];
  const idsByKey: Record<string, string> = {};

  seeds.forEach((seed, offset) => {
    const index = startIndex + offset;
    const pid = profileId(index);
    const eid = employeeId(index);
    idsByKey[seed.key] = eid;
    profiles.push({
      id: pid,
      clerkId: `user_${seed.key.replace(/[^a-z0-9]/gi, "_")}`,
      email: seed.email,
      fullName: seed.fullName,
      role: "employee",
      passwordHash,
      avatarUrl: null,
    });
    employees.push({
      id: eid,
      profileId: pid,
      managerId: bossEmployeeId,
      title: seed.title,
      department: seed.department,
      jobRole: seed.jobRole,
      hireDate: seed.hireDate,
    });
  });

  return { profiles, employees, idsByKey };
}

type TaskSeed = {
  id: string;
  title: string;
  description: string;
  assigneeKey: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueOffsetDays: number;
  isBlocked: boolean;
  comment?: string;
};

const TASK_SEEDS: TaskSeed[] = [
  { id: "t1", title: "Ship reliability dashboard", description: "Build a live view of latency, error budget, and incident MTTR for production services.", assigneeKey: "aisha", status: "in_progress", priority: "high", dueOffsetDays: 7, isBlocked: false, comment: "Dashboard shell is live. Wiring remaining service metrics today." },
  { id: "t2", title: "Reduce checkout API latency", description: "Profile hot paths and ship caching plus query improvements on checkout endpoints.", assigneeKey: "samir", status: "not_started", priority: "medium", dueOffsetDays: 14, isBlocked: true, comment: "Blocked waiting on staging access credentials from infra." },
  { id: "t3", title: "Redesign employee task cards", description: "Improve clarity of status transitions and inline progress comments.", assigneeKey: "leo", status: "completed", priority: "low", dueOffsetDays: 7, isBlocked: false, comment: "Shipped updated card layout with inline comment box." },
  { id: "t4", title: "Document on-call runbook", description: "Shadow two incidents and publish an updated on-call playbook.", assigneeKey: "samir", status: "in_progress", priority: "high", dueOffsetDays: 7, isBlocked: false },
  { id: "t5", title: "Launch Q3 campaign landing page", description: "Ship responsive landing page with analytics events and A/B test hooks.", assigneeKey: "emma", status: "in_progress", priority: "high", dueOffsetDays: 10, isBlocked: false, comment: "Hero section approved. Building form integration next." },
  { id: "t6", title: "Close enterprise renewal pipeline", description: "Follow up on 12 renewal accounts and update forecast in CRM.", assigneeKey: "james", status: "not_started", priority: "high", dueOffsetDays: 5, isBlocked: false },
  { id: "t7", title: "Migrate auth service to new cluster", description: "Coordinate cutover with zero-downtime deployment plan.", assigneeKey: "ryan", status: "in_progress", priority: "high", dueOffsetDays: 12, isBlocked: true, comment: "Waiting on infra to provision the new cluster." },
  { id: "t8", title: "Run usability study on onboarding", description: "Recruit 8 participants and synthesize findings into recommendations.", assigneeKey: "sofia", status: "in_progress", priority: "medium", dueOffsetDays: 9, isBlocked: false },
  { id: "t9", title: "Publish API rate-limit documentation", description: "Document limits, headers, and retry guidance for partner integrations.", assigneeKey: "nina", status: "completed", priority: "medium", dueOffsetDays: 6, isBlocked: false, comment: "Docs merged and shared with partner success." },
  { id: "t10", title: "Automate weekly sales report", description: "Build a scheduled export from CRM to the leadership Slack channel.", assigneeKey: "marcus", status: "not_started", priority: "low", dueOffsetDays: 15, isBlocked: false },
  { id: "t11", title: "Refresh component library tokens", description: "Align color, spacing, and typography tokens with the new brand system.", assigneeKey: "maya", status: "in_progress", priority: "medium", dueOffsetDays: 11, isBlocked: false },
  { id: "t12", title: "Define H2 product roadmap", description: "Consolidate team inputs and publish a prioritized roadmap draft.", assigneeKey: "jordan", status: "in_progress", priority: "high", dueOffsetDays: 8, isBlocked: false },
  { id: "t13", title: "Resolve tier-2 support backlog", description: "Clear oldest 30 tickets and document recurring issue patterns.", assigneeKey: "fatima", status: "in_progress", priority: "high", dueOffsetDays: 4, isBlocked: false },
  { id: "t14", title: "Implement checkout error monitoring", description: "Add alerts for payment failures and timeout spikes.", assigneeKey: "carlos", status: "not_started", priority: "medium", dueOffsetDays: 13, isBlocked: false },
  { id: "t15", title: "Prepare monthly finance close", description: "Reconcile expenses and submit variance report to leadership.", assigneeKey: "tom", status: "in_progress", priority: "high", dueOffsetDays: 3, isBlocked: false },
  { id: "t16", title: "Build data pipeline for churn model", description: "Ingest product usage signals into the analytics warehouse.", assigneeKey: "arjun", status: "not_started", priority: "medium", dueOffsetDays: 16, isBlocked: true, comment: "Blocked on warehouse schema approval." },
  { id: "t17", title: "Onboard two new enterprise accounts", description: "Complete kickoff calls and configure success playbooks.", assigneeKey: "zoe", status: "completed", priority: "medium", dueOffsetDays: 7, isBlocked: false },
  { id: "t18", title: "Write regression suite for mobile checkout", description: "Cover happy path and top three failure scenarios in CI.", assigneeKey: "liam", status: "in_progress", priority: "medium", dueOffsetDays: 10, isBlocked: false },
  { id: "t19", title: "Source candidates for platform team", description: "Screen 15 profiles and schedule first-round interviews.", assigneeKey: "olivia", status: "not_started", priority: "low", dueOffsetDays: 14, isBlocked: false },
  { id: "t20", title: "Ship illustration pack for marketing", description: "Deliver 12 on-brand illustrations for the autumn campaign.", assigneeKey: "isla", status: "in_progress", priority: "low", dueOffsetDays: 12, isBlocked: false },
];

export function seedDb(): Db {
  const now = new Date().toISOString();
  const dueDate = (days: number) =>
    new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);

  const bossProfile: Profile = {
    id: P.boss,
    clerkId: "user_boss",
    email: "boss@suii.app",
    fullName: "Alex Morgan",
    role: "boss",
    passwordHash: hashPassword("boss123"),
    avatarUrl: null,
  };

  const hrProfile: Profile = {
    id: P.hr,
    clerkId: "user_hr",
    email: "hr@suii.app",
    fullName: "Priya Nair",
    role: "hr",
    passwordHash: hashPassword("hr123"),
    avatarUrl: null,
  };

  const bossEmployee: Employee = {
    id: E.boss,
    profileId: P.boss,
    managerId: null,
    title: "Chief Operating Officer",
    department: "Executive",
    jobRole: "Boss",
    hireDate: "2020-01-01",
  };

  const hrEmployee: Employee = {
    id: E.hr,
    profileId: P.hr,
    managerId: E.boss,
    title: "Head of People",
    department: "People",
    jobRole: "HR",
    hireDate: "2021-03-01",
  };

  const legacyIdsByKey: Record<string, string> = {
    aisha: E.aisha,
    samir: E.samir,
    leo: E.leo,
  };

  const extraBuilt = buildEmployeeRecords(EXTRA_EMPLOYEES, 100, E.boss);
  const idsByKey = { ...legacyIdsByKey, ...extraBuilt.idsByKey };

  const legacyCoreProfiles: Profile[] = [
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
  ];

  const legacyCoreEmployees: Employee[] = [
    { id: E.aisha, profileId: P.aisha, managerId: E.boss, title: "Senior Software Engineer", department: "Engineering", jobRole: "Engineer", hireDate: "2023-02-14" },
    { id: E.samir, profileId: P.samir, managerId: E.boss, title: "Software Engineer", department: "Engineering", jobRole: "Engineer", hireDate: "2024-04-01" },
    { id: E.leo, profileId: P.leo, managerId: E.boss, title: "Product Designer", department: "Design", jobRole: "Designer", hireDate: "2023-09-18" },
  ];

  const tasks: Task[] = TASK_SEEDS.map((seed) => ({
    id: seed.id,
    title: seed.title,
    description: seed.description,
    assigneeId: idsByKey[seed.assigneeKey],
    createdById: E.boss,
    status: seed.status,
    priority: seed.priority,
    dueDate: dueDate(seed.dueOffsetDays),
    isBlocked: seed.isBlocked,
    completedAt: seed.status === "completed" ? now : null,
    createdAt: now,
    updatedAt: now,
  }));

  const taskComments: TaskComment[] = TASK_SEEDS.flatMap((seed, index) => {
    if (!seed.comment) return [];
    return [
      {
        id: `c${index + 1}`,
        taskId: seed.id,
        authorId: idsByKey[seed.assigneeKey],
        body: seed.comment,
        createdAt: now,
      },
    ];
  });

  return {
    profiles: [bossProfile, hrProfile, ...legacyCoreProfiles, ...extraBuilt.profiles],
    employees: [bossEmployee, hrEmployee, ...legacyCoreEmployees, ...extraBuilt.employees],
    tasks,
    taskComments,
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
