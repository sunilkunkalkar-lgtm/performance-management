import type {
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
  ReviewCycle,
  RoleBenchmark,
  Skill,
} from "@/lib/pms/types";
import type { Database } from "./database.types";

type Tables = Database["public"]["Tables"];

export function mapProfile(row: Tables["profiles"]["Row"]): Profile {
  return {
    id: row.id,
    clerkId: row.clerk_id,
    email: row.email,
    fullName: row.full_name,
    role: row.role,
    avatarUrl: row.avatar_url,
  };
}

export function mapEmployee(row: Tables["employees"]["Row"]): Employee {
  return {
    id: row.id,
    profileId: row.profile_id,
    managerId: row.manager_id,
    title: row.title,
    department: row.department,
    jobRole: row.job_role,
    hireDate: row.hire_date,
  };
}

export function mapPerson(employee: Tables["employees"]["Row"], profile: Tables["profiles"]["Row"]): Person {
  return {
    ...mapEmployee(employee),
    fullName: profile.full_name,
    email: profile.email,
    role: profile.role,
    clerkId: profile.clerk_id,
  };
}

export function mapReviewCycle(row: Tables["review_cycles"]["Row"]): ReviewCycle {
  return {
    id: row.id,
    name: row.name,
    kind: row.kind,
    startDate: row.start_date,
    endDate: row.end_date,
    status: row.status,
  };
}

export function mapGoal(row: Tables["goals"]["Row"]): Goal {
  return {
    id: row.id,
    employeeId: row.employee_id,
    cycleId: row.cycle_id,
    parentGoalId: row.parent_goal_id,
    title: row.title,
    description: row.description,
    status: row.status,
    approvalStatus: row.approval_status,
    managerComment: row.manager_comment,
    weight: row.weight,
    dueDate: row.due_date,
    submittedAt: row.submitted_at,
    reviewedAt: row.reviewed_at,
    createdAt: row.created_at,
  };
}

export function mapKeyResult(row: Tables["key_results"]["Row"]): KeyResult {
  return {
    id: row.id,
    goalId: row.goal_id,
    title: row.title,
    metric: row.metric,
    target: Number(row.target),
    currentValue: Number(row.current_value),
    unit: row.unit,
    sortOrder: row.sort_order,
  };
}

export function mapAppraisal(row: Tables["appraisals"]["Row"]): Appraisal {
  return {
    id: row.id,
    cycleId: row.cycle_id,
    employeeId: row.employee_id,
    managerId: row.manager_id,
    selfStatus: row.self_status,
    managerStatus: row.manager_status,
    selfSummary: row.self_summary,
    managerSummary: row.manager_summary,
    selfRating: row.self_rating,
    managerRating: row.manager_rating,
    selfSubmittedAt: row.self_submitted_at,
    managerSubmittedAt: row.manager_submitted_at,
  };
}

export function mapAppraisalScore(row: Tables["appraisal_scores"]["Row"]): AppraisalScore {
  return {
    id: row.id,
    appraisalId: row.appraisal_id,
    competency: row.competency,
    selfScore: row.self_score,
    managerScore: row.manager_score,
  };
}

export function mapCheckIn(row: Tables["check_ins"]["Row"]): CheckIn {
  return {
    id: row.id,
    employeeId: row.employee_id,
    cycleId: row.cycle_id,
    scheduledAt: row.scheduled_at,
    completedAt: row.completed_at,
    status: row.status,
    notes: row.notes,
  };
}

export function mapKudo(row: Tables["kudos"]["Row"]): Kudo {
  return {
    id: row.id,
    fromEmployeeId: row.from_employee_id,
    toEmployeeId: row.to_employee_id,
    badge: row.badge,
    message: row.message,
    createdAt: row.created_at,
  };
}

export function mapSkill(row: Tables["skills"]["Row"]): Skill {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
  };
}

export function mapRoleBenchmark(row: Tables["role_skill_benchmarks"]["Row"]): RoleBenchmark {
  return {
    id: row.id,
    jobRole: row.job_role,
    skillId: row.skill_id,
    expectedLevel: row.expected_level,
  };
}

export function mapEmployeeSkill(row: Tables["employee_skills"]["Row"]): EmployeeSkill {
  return {
    employeeId: row.employee_id,
    skillId: row.skill_id,
    level: row.level,
  };
}

export function mapFlightRiskRow(row: Database["public"]["Views"]["flight_risk_radar"]["Row"]): FlightRiskRow {
  return {
    employeeId: row.employee_id,
    fullName: row.full_name,
    title: row.title,
    department: row.department,
    managerId: row.manager_id,
    goalCompletionRate: Number(row.goal_completion_rate),
    missedCheckins: Number(row.missed_checkins),
    pendingReviews: Number(row.pending_reviews),
    riskScore: Number(row.risk_score),
  };
}

export function toGoalInsert(goal: Pick<Goal, "employeeId" | "cycleId" | "parentGoalId" | "title" | "description" | "status" | "approvalStatus" | "managerComment" | "weight" | "dueDate" | "submittedAt" | "reviewedAt" | "createdAt">): Tables["goals"]["Insert"] {
  return {
    employee_id: goal.employeeId,
    cycle_id: goal.cycleId,
    parent_goal_id: goal.parentGoalId,
    title: goal.title,
    description: goal.description,
    status: goal.status,
    approval_status: goal.approvalStatus,
    manager_comment: goal.managerComment,
    weight: goal.weight,
    due_date: goal.dueDate,
    submitted_at: goal.submittedAt,
    reviewed_at: goal.reviewedAt,
    created_at: goal.createdAt,
  };
}

export function toKeyResultInsert(kr: Pick<KeyResult, "goalId" | "title" | "metric" | "target" | "currentValue" | "unit" | "sortOrder">): Tables["key_results"]["Insert"] {
  return {
    goal_id: kr.goalId,
    title: kr.title,
    metric: kr.metric,
    target: kr.target,
    current_value: kr.currentValue,
    unit: kr.unit,
    sort_order: kr.sortOrder,
  };
}

export function toKudoInsert(kudo: Pick<Kudo, "fromEmployeeId" | "toEmployeeId" | "badge" | "message" | "createdAt">): Tables["kudos"]["Insert"] {
  return {
    from_employee_id: kudo.fromEmployeeId,
    to_employee_id: kudo.toEmployeeId,
    badge: kudo.badge,
    message: kudo.message,
    created_at: kudo.createdAt,
  };
}
