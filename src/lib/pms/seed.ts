import type {
  Actor,
  Appraisal,
  AppraisalScore,
  CheckIn,
  Employee,
  EmployeeSkill,
  FlightRiskRow,
  Goal,
  KeyResult,
  Kudo,
  Person,
  Profile,
  Result,
  ReviewCycle,
  RoleBenchmark,
  Skill,
} from "./types";

export type Db = {
  profiles: Profile[];
  employees: Employee[];
  cycles: ReviewCycle[];
  goals: Goal[];
  keyResults: KeyResult[];
  appraisals: Appraisal[];
  appraisalScores: AppraisalScore[];
  checkIns: CheckIn[];
  kudos: Kudo[];
  skills: Skill[];
  benchmarks: RoleBenchmark[];
  employeeSkills: EmployeeSkill[];
};

const P = {
  priya: "11111111-1111-1111-1111-111111111111",
  marcus: "22222222-2222-2222-2222-222222222222",
  maya: "33333333-3333-3333-3333-333333333333",
  aisha: "44444444-4444-4444-4444-444444444444",
  samir: "55555555-5555-5555-5555-555555555555",
  leo: "66666666-6666-6666-6666-666666666666",
  jordan: "77777777-7777-7777-7777-777777777777",
};

const E = {
  priya: "a1111111-1111-1111-1111-111111111111",
  marcus: "a2222222-2222-2222-2222-222222222222",
  maya: "a3333333-3333-3333-3333-333333333333",
  aisha: "a4444444-4444-4444-4444-444444444444",
  samir: "a5555555-5555-5555-5555-555555555555",
  leo: "a6666666-6666-6666-6666-666666666666",
  jordan: "a7777777-7777-7777-7777-777777777777",
};

const C = {
  closed: "c0000000-0000-0000-0000-000000000001",
  active: "c0000000-0000-0000-0000-000000000002",
  upcoming: "c0000000-0000-0000-0000-000000000003",
};

export const DEMO_ACCOUNTS = [
  { email: "priya@suii.app", name: "Priya Nair", role: "People / Admin", clerkId: "user_demo_priya" },
  { email: "marcus@suii.app", name: "Marcus Chen", role: "Engineering Manager", clerkId: "user_demo_marcus" },
  { email: "maya@suii.app", name: "Maya Okonkwo", role: "Design Manager", clerkId: "user_demo_maya" },
  { email: "aisha@suii.app", name: "Aisha Rahman", role: "Senior Engineer", clerkId: "user_demo_aisha" },
  { email: "samir@suii.app", name: "Samir Joshi", role: "Engineer", clerkId: "user_demo_samir" },
  { email: "leo@suii.app", name: "Leo Park", role: "Designer", clerkId: "user_demo_leo" },
  { email: "jordan@suii.app", name: "Jordan Hale", role: "Product Manager", clerkId: "user_demo_jordan" },
] as const;

export function seedDb(): Db {
  const now = new Date().toISOString();
  return {
    profiles: [
      { id: P.priya, clerkId: "user_demo_priya", email: "priya@suii.app", fullName: "Priya Nair", role: "admin", avatarUrl: null },
      { id: P.marcus, clerkId: "user_demo_marcus", email: "marcus@suii.app", fullName: "Marcus Chen", role: "manager", avatarUrl: null },
      { id: P.maya, clerkId: "user_demo_maya", email: "maya@suii.app", fullName: "Maya Okonkwo", role: "manager", avatarUrl: null },
      { id: P.aisha, clerkId: "user_demo_aisha", email: "aisha@suii.app", fullName: "Aisha Rahman", role: "employee", avatarUrl: null },
      { id: P.samir, clerkId: "user_demo_samir", email: "samir@suii.app", fullName: "Samir Joshi", role: "employee", avatarUrl: null },
      { id: P.leo, clerkId: "user_demo_leo", email: "leo@suii.app", fullName: "Leo Park", role: "employee", avatarUrl: null },
      { id: P.jordan, clerkId: "user_demo_jordan", email: "jordan@suii.app", fullName: "Jordan Hale", role: "employee", avatarUrl: null },
    ],
    employees: [
      { id: E.priya, profileId: P.priya, managerId: null, title: "Head of People", department: "People", jobRole: "People Partner", hireDate: "2021-03-01" },
      { id: E.marcus, profileId: P.marcus, managerId: E.priya, title: "Engineering Manager", department: "Engineering", jobRole: "Engineering Manager", hireDate: "2022-01-10" },
      { id: E.maya, profileId: P.maya, managerId: E.priya, title: "Design Manager", department: "Design", jobRole: "Design Manager", hireDate: "2022-06-01" },
      { id: E.aisha, profileId: P.aisha, managerId: E.marcus, title: "Senior Software Engineer", department: "Engineering", jobRole: "Senior Engineer", hireDate: "2023-02-14" },
      { id: E.samir, profileId: P.samir, managerId: E.marcus, title: "Software Engineer", department: "Engineering", jobRole: "Engineer", hireDate: "2024-04-01" },
      { id: E.leo, profileId: P.leo, managerId: E.maya, title: "Product Designer", department: "Design", jobRole: "Product Designer", hireDate: "2023-09-18" },
      { id: E.jordan, profileId: P.jordan, managerId: E.priya, title: "Product Manager", department: "Product", jobRole: "Product Manager", hireDate: "2022-11-07" },
    ],
    cycles: [
      { id: C.closed, name: "FY25 Annual Review", kind: "Annual", startDate: "2025-11-01", endDate: "2026-01-15", status: "closed" },
      { id: C.active, name: "FY26 H1 Review", kind: "Mid-year", startDate: "2026-07-01", endDate: "2026-09-30", status: "active" },
      { id: C.upcoming, name: "FY26 Annual Review", kind: "Annual", startDate: "2026-11-01", endDate: "2027-01-15", status: "upcoming" },
    ],
    goals: [
      { id: "g1", employeeId: E.priya, cycleId: C.active, parentGoalId: null, title: "Make performance conversations worth having", description: "Company OKR: ship a trusted review system and raise completion quality.", status: "in_progress", approvalStatus: "approved", managerComment: "", weight: 40, dueDate: "2026-09-30", submittedAt: now, reviewedAt: now, createdAt: now },
      { id: "g2", employeeId: E.marcus, cycleId: C.active, parentGoalId: "g1", title: "Raise engineering delivery predictability", description: "Keep spillover under 15% and close 1:1s on time.", status: "in_progress", approvalStatus: "approved", managerComment: "", weight: 30, dueDate: "2026-09-30", submittedAt: now, reviewedAt: now, createdAt: now },
      { id: "g3", employeeId: E.aisha, cycleId: C.active, parentGoalId: "g2", title: "Ship reliability dashboard for production services", description: "Live view of latency, error budget, and incident MTTR.", status: "in_progress", approvalStatus: "approved", managerComment: "Strong cascade from the team OKR.", weight: 40, dueDate: "2026-09-15", submittedAt: now, reviewedAt: now, createdAt: now },
      { id: "g4", employeeId: E.samir, cycleId: C.active, parentGoalId: "g2", title: "Reduce p95 API latency on checkout", description: "Profile hot paths and ship caching plus query improvements.", status: "not_started", approvalStatus: "pending_approval", managerComment: "", weight: 50, dueDate: "2026-08-31", submittedAt: now, reviewedAt: null, createdAt: now },
      { id: "g5", employeeId: E.leo, cycleId: C.active, parentGoalId: "g1", title: "Redesign the self-review experience", description: "Clearer rubrics and manager prompts.", status: "in_progress", approvalStatus: "approved", managerComment: "", weight: 35, dueDate: "2026-09-01", submittedAt: now, reviewedAt: now, createdAt: now },
      { id: "g6", employeeId: E.samir, cycleId: C.active, parentGoalId: null, title: "Complete first on-call rotation independently", description: "Shadow two incidents and own a retro.", status: "not_started", approvalStatus: "draft", managerComment: "", weight: 20, dueDate: "2026-09-30", submittedAt: null, reviewedAt: null, createdAt: now },
    ],
    keyResults: [
      { id: "kr1", goalId: "g1", title: "Review completion rate", metric: "Completion", target: 95, currentValue: 62, unit: "%", sortOrder: 1 },
      { id: "kr2", goalId: "g2", title: "Sprint spillover", metric: "Spillover", target: 15, currentValue: 18, unit: "%", sortOrder: 1 },
      { id: "kr3", goalId: "g3", title: "Services instrumented", metric: "Coverage", target: 8, currentValue: 5, unit: "services", sortOrder: 1 },
      { id: "kr4", goalId: "g4", title: "Checkout p95", metric: "Latency", target: 180, currentValue: 240, unit: "ms", sortOrder: 1 },
      { id: "kr5", goalId: "g5", title: "Usability tests", metric: "Sessions", target: 12, currentValue: 9, unit: "sessions", sortOrder: 1 },
    ],
    appraisals: [
      { id: "r1", cycleId: C.active, employeeId: E.aisha, managerId: E.marcus, selfStatus: "in_progress", managerStatus: "not_started", selfSummary: "Led reliability instrumentation for five services and started mentoring Samir.", managerSummary: "", selfRating: 4, managerRating: null, selfSubmittedAt: null, managerSubmittedAt: null },
      { id: "r2", cycleId: C.active, employeeId: E.samir, managerId: E.marcus, selfStatus: "not_started", managerStatus: "not_started", selfSummary: "", managerSummary: "", selfRating: null, managerRating: null, selfSubmittedAt: null, managerSubmittedAt: null },
      { id: "r3", cycleId: C.active, employeeId: E.leo, managerId: E.maya, selfStatus: "submitted", managerStatus: "in_progress", selfSummary: "Completed usability tests on the review flow.", managerSummary: "", selfRating: 4, managerRating: null, selfSubmittedAt: now, managerSubmittedAt: null },
    ],
    appraisalScores: [
      { id: "s1", appraisalId: "r1", competency: "Impact", selfScore: 4, managerScore: null },
      { id: "s2", appraisalId: "r1", competency: "Collaboration", selfScore: 4, managerScore: null },
      { id: "s3", appraisalId: "r1", competency: "Craft", selfScore: 5, managerScore: null },
      { id: "s4", appraisalId: "r1", competency: "Ownership", selfScore: 4, managerScore: null },
      { id: "s5", appraisalId: "r1", competency: "Growth", selfScore: 4, managerScore: null },
      { id: "s6", appraisalId: "r2", competency: "Impact", selfScore: null, managerScore: null },
      { id: "s7", appraisalId: "r2", competency: "Collaboration", selfScore: null, managerScore: null },
      { id: "s8", appraisalId: "r2", competency: "Craft", selfScore: null, managerScore: null },
      { id: "s9", appraisalId: "r2", competency: "Ownership", selfScore: null, managerScore: null },
      { id: "s10", appraisalId: "r2", competency: "Growth", selfScore: null, managerScore: null },
      { id: "s11", appraisalId: "r3", competency: "Impact", selfScore: 4, managerScore: null },
      { id: "s12", appraisalId: "r3", competency: "Collaboration", selfScore: 5, managerScore: null },
      { id: "s13", appraisalId: "r3", competency: "Craft", selfScore: 5, managerScore: null },
      { id: "s14", appraisalId: "r3", competency: "Ownership", selfScore: 4, managerScore: null },
      { id: "s15", appraisalId: "r3", competency: "Growth", selfScore: 4, managerScore: null },
    ],
    checkIns: [
      { id: "ci1", employeeId: E.aisha, cycleId: C.active, scheduledAt: "2026-07-15", completedAt: "2026-07-15", status: "completed", notes: "On track" },
      { id: "ci2", employeeId: E.aisha, cycleId: C.active, scheduledAt: "2026-08-15", completedAt: "2026-08-15", status: "completed", notes: "Dashboard live" },
      { id: "ci3", employeeId: E.samir, cycleId: C.active, scheduledAt: "2026-07-15", completedAt: null, status: "missed", notes: "" },
      { id: "ci4", employeeId: E.samir, cycleId: C.active, scheduledAt: "2026-08-15", completedAt: null, status: "missed", notes: "" },
      { id: "ci5", employeeId: E.leo, cycleId: C.active, scheduledAt: "2026-08-01", completedAt: "2026-08-01", status: "completed", notes: "Prototype review" },
    ],
    kudos: [
      { id: "k1", fromEmployeeId: E.marcus, toEmployeeId: E.aisha, badge: "Impact", message: "The reliability charts made incident tradeoffs obvious. That is the leadership I want more of.", createdAt: new Date(Date.now() - 86400000 * 2).toISOString() },
      { id: "k2", fromEmployeeId: E.samir, toEmployeeId: E.aisha, badge: "Growth", message: "Thanks for walking me through the on-call runbook.", createdAt: new Date(Date.now() - 86400000).toISOString() },
      { id: "k3", fromEmployeeId: E.jordan, toEmployeeId: E.leo, badge: "Craft", message: "The self-review prototype cut our confusion in half.", createdAt: new Date(Date.now() - 10800000).toISOString() },
    ],
    skills: [
      { id: "sk1", name: "System design", category: "Craft" },
      { id: "sk2", name: "Incident response", category: "Craft" },
      { id: "sk3", name: "Coaching", category: "Leadership" },
      { id: "sk4", name: "Product sense", category: "Product" },
      { id: "sk5", name: "Written communication", category: "Collaboration" },
      { id: "sk6", name: "Visual design", category: "Craft" },
    ],
    benchmarks: [
      { id: "b1", jobRole: "Senior Engineer", skillId: "sk1", expectedLevel: 4 },
      { id: "b2", jobRole: "Senior Engineer", skillId: "sk2", expectedLevel: 4 },
      { id: "b3", jobRole: "Senior Engineer", skillId: "sk3", expectedLevel: 3 },
      { id: "b4", jobRole: "Senior Engineer", skillId: "sk5", expectedLevel: 4 },
      { id: "b5", jobRole: "Engineer", skillId: "sk1", expectedLevel: 3 },
      { id: "b6", jobRole: "Engineer", skillId: "sk2", expectedLevel: 3 },
      { id: "b7", jobRole: "Engineer", skillId: "sk5", expectedLevel: 3 },
      { id: "b8", jobRole: "Engineering Manager", skillId: "sk3", expectedLevel: 5 },
      { id: "b9", jobRole: "Engineering Manager", skillId: "sk5", expectedLevel: 4 },
      { id: "b10", jobRole: "Product Designer", skillId: "sk6", expectedLevel: 4 },
      { id: "b11", jobRole: "Product Designer", skillId: "sk4", expectedLevel: 3 },
      { id: "b12", jobRole: "Product Designer", skillId: "sk5", expectedLevel: 4 },
    ],
    employeeSkills: [
      { employeeId: E.aisha, skillId: "sk1", level: 4 },
      { employeeId: E.aisha, skillId: "sk2", level: 5 },
      { employeeId: E.aisha, skillId: "sk3", level: 3 },
      { employeeId: E.aisha, skillId: "sk5", level: 4 },
      { employeeId: E.samir, skillId: "sk1", level: 2 },
      { employeeId: E.samir, skillId: "sk2", level: 2 },
      { employeeId: E.samir, skillId: "sk5", level: 3 },
      { employeeId: E.marcus, skillId: "sk3", level: 4 },
      { employeeId: E.marcus, skillId: "sk5", level: 4 },
      { employeeId: E.leo, skillId: "sk6", level: 5 },
      { employeeId: E.leo, skillId: "sk4", level: 3 },
      { employeeId: E.leo, skillId: "sk5", level: 4 },
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

export function actorFromClerkId(db: Db, clerkId: string): Actor | null {
  return peopleOf(db).find((p) => p.clerkId === clerkId) ?? null;
}

export function canAccess(actor: Actor, employeeId: string, db: Db) {
  if (actor.role === "admin" || actor.id === employeeId) return true;
  const target = db.employees.find((e) => e.id === employeeId);
  return target?.managerId === actor.id;
}

export function ok<T>(data: T): Result<T> {
  return { data, error: null };
}

export function fail(error: string): Result<never> {
  return { data: null, error };
}

export function flightRisk(db: Db, actor: Actor): FlightRiskRow[] {
  const active = db.cycles.find((c) => c.status === "active");
  if (actor.role === "employee") return [];
  const visible = db.employees.filter((e) =>
    actor.role === "admin" ? e.id !== actor.id : e.managerId === actor.id,
  );
  const rows = visible.map((e) => {
    const profile = db.profiles.find((p) => p.id === e.profileId)!;
    const goals = db.goals.filter(
      (g) => g.employeeId === e.id && g.cycleId === active?.id && g.approvalStatus === "approved",
    );
    const achieved = goals.filter((g) => g.status === "achieved").length;
    const goalCompletionRate = goals.length ? Math.round((100 * achieved) / goals.length) : 0;
    const missedCheckins = db.checkIns.filter(
      (c) => c.employeeId === e.id && c.cycleId === active?.id && c.status === "missed",
    ).length;
    const pendingReviews = db.appraisals.filter(
      (a) =>
        a.employeeId === e.id &&
        a.cycleId === active?.id &&
        a.selfStatus !== "completed" &&
        a.managerStatus !== "completed",
    ).length;
    const riskScore =
      (goalCompletionRate < 40 ? 40 : 0) + missedCheckins * 20 + pendingReviews * 15;
    return {
      employeeId: e.id,
      fullName: profile.fullName,
      title: e.title,
      department: e.department,
      managerId: e.managerId,
      goalCompletionRate,
      missedCheckins,
      pendingReviews,
      riskScore,
    };
  });
  return rows.sort((a, b) => b.riskScore - a.riskScore);
}
