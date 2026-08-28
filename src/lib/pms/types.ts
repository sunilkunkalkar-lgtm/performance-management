export type AppRole = "employee" | "manager" | "admin";
export type GoalStatus = "not_started" | "in_progress" | "achieved";
export type ApprovalStatus = "draft" | "pending_approval" | "approved" | "rejected";
export type CycleStatus = "upcoming" | "active" | "closed";
export type AppraisalStatus = "not_started" | "in_progress" | "submitted" | "completed";
export type CheckinStatus = "scheduled" | "completed" | "missed";

export type Profile = {
  id: string;
  clerkId: string;
  email: string;
  fullName: string;
  role: AppRole;
  avatarUrl: string | null;
};

export type Employee = {
  id: string;
  profileId: string;
  managerId: string | null;
  title: string;
  department: string;
  jobRole: string;
  hireDate: string | null;
};

export type Person = Employee & {
  fullName: string;
  email: string;
  role: AppRole;
  clerkId: string;
};

export type ReviewCycle = {
  id: string;
  name: string;
  kind: string;
  startDate: string;
  endDate: string;
  status: CycleStatus;
};

export type Goal = {
  id: string;
  employeeId: string;
  cycleId: string;
  parentGoalId: string | null;
  title: string;
  description: string;
  status: GoalStatus;
  approvalStatus: ApprovalStatus;
  managerComment: string;
  weight: number;
  dueDate: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  createdAt: string;
};

export type KeyResult = {
  id: string;
  goalId: string;
  title: string;
  metric: string;
  target: number;
  currentValue: number;
  unit: string;
  sortOrder: number;
};

export type Appraisal = {
  id: string;
  cycleId: string;
  employeeId: string;
  managerId: string;
  selfStatus: AppraisalStatus;
  managerStatus: AppraisalStatus;
  selfSummary: string;
  managerSummary: string;
  selfRating: number | null;
  managerRating: number | null;
  selfSubmittedAt: string | null;
  managerSubmittedAt: string | null;
};

export type AppraisalScore = {
  id: string;
  appraisalId: string;
  competency: string;
  selfScore: number | null;
  managerScore: number | null;
};

export type CheckIn = {
  id: string;
  employeeId: string;
  cycleId: string;
  scheduledAt: string;
  completedAt: string | null;
  status: CheckinStatus;
  notes: string;
};

export type Kudo = {
  id: string;
  fromEmployeeId: string;
  toEmployeeId: string;
  badge: string;
  message: string;
  createdAt: string;
};

export type Skill = { id: string; name: string; category: string };
export type RoleBenchmark = { id: string; jobRole: string; skillId: string; expectedLevel: number };
export type EmployeeSkill = { employeeId: string; skillId: string; level: number };

export type FlightRiskRow = {
  employeeId: string;
  fullName: string;
  title: string;
  department: string;
  managerId: string | null;
  goalCompletionRate: number;
  missedCheckins: number;
  pendingReviews: number;
  riskScore: number;
};

export type Actor = Person;

export type Result<T> = { data: T; error: null } | { data: null; error: string };
