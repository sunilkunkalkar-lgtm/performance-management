import { getDb, persistDb, requireActor } from "./context";
import { canAccess, fail, flightRisk, ok, peopleOf } from "./seed";
import type { ApprovalStatus, GoalStatus, Result } from "./types";

function id() {
  return crypto.randomUUID();
}

export async function listPeople() {
  const actor = await requireActor();
  return { actor, people: peopleOf(getDb()) };
}

export async function listCycles() {
  const actor = await requireActor();
  return { actor, cycles: getDb().cycles };
}

export async function activeCycle() {
  return getDb().cycles.find((c) => c.status === "active") ?? null;
}

export async function listGoalsForActor() {
  const actor = await requireActor();
  const db = getDb();
  const manager = db.employees.find((e) => e.id === actor.managerId);
  const skip = manager?.managerId;
  const goals = db.goals.filter((g) => {
    if (canAccess(actor, g.employeeId, db)) return true;
    if (g.approvalStatus !== "approved") return false;
    return g.employeeId === actor.managerId || (skip != null && g.employeeId === skip);
  });
  return { actor, goals, keyResults: db.keyResults, people: peopleOf(db), cycles: db.cycles };
}

export async function getGoal(goalId: string) {
  const actor = await requireActor();
  const db = getDb();
  const goal = db.goals.find((g) => g.id === goalId);
  if (!goal) return { actor, goal: null, error: "Goal not found." };
  const manager = db.employees.find((e) => e.id === actor.managerId);
  const skip = manager?.managerId;
  const canRead =
    canAccess(actor, goal.employeeId, db) ||
    (goal.approvalStatus === "approved" &&
      (goal.employeeId === actor.managerId || (skip != null && goal.employeeId === skip)));
  if (!canRead) {
    return { actor, goal: null, error: "You do not have access to this goal." };
  }
  return {
    actor,
    goal,
    keyResults: db.keyResults.filter((k) => k.goalId === goal.id),
    people: peopleOf(db),
    parent: goal.parentGoalId ? db.goals.find((g) => g.id === goal.parentGoalId) ?? null : null,
    error: null,
  };
}

export async function createGoal(input: {
  title: string;
  description: string;
  parentGoalId: string | null;
  weight: number;
  dueDate: string;
  krTitle: string;
  krTarget: number;
  krUnit: string;
}): Promise<Result<{ id: string }>> {
  const actor = await requireActor();
  const cycle = await activeCycle();
  if (!cycle) return fail("No active review cycle.");
  if (!input.title.trim() || !input.description.trim()) return fail("Title and description are required.");
  const db = getDb();
  const goalId = id();
  const now = new Date().toISOString();
  db.goals.push({
    id: goalId,
    employeeId: actor.id,
    cycleId: cycle.id,
    parentGoalId: input.parentGoalId,
    title: input.title.trim(),
    description: input.description.trim(),
    status: "not_started",
    approvalStatus: "draft",
    managerComment: "",
    weight: input.weight || 25,
    dueDate: input.dueDate || null,
    submittedAt: null,
    reviewedAt: null,
    createdAt: now,
  });
  if (input.krTitle.trim()) {
    db.keyResults.push({
      id: id(),
      goalId,
      title: input.krTitle.trim(),
      metric: input.krTitle.trim(),
      target: input.krTarget || 1,
      currentValue: 0,
      unit: input.krUnit.trim() || "units",
      sortOrder: 1,
    });
  }
  persistDb();
  return ok({ id: goalId });
}

export async function submitGoal(goalId: string): Promise<Result<true>> {
  const actor = await requireActor();
  const db = getDb();
  const goal = db.goals.find((g) => g.id === goalId);
  if (!goal) return fail("Goal not found.");
  if (goal.employeeId !== actor.id && actor.role !== "admin") return fail("Only the owner can submit this goal.");
  goal.approvalStatus = "pending_approval";
  goal.submittedAt = new Date().toISOString();
  persistDb();
  return ok(true);
}

export async function decideGoal(
  goalId: string,
  decision: Extract<ApprovalStatus, "approved" | "rejected">,
  comment: string,
): Promise<Result<true>> {
  const actor = await requireActor();
  const db = getDb();
  const goal = db.goals.find((g) => g.id === goalId);
  if (!goal) return fail("Goal not found.");
  if (!canAccess(actor, goal.employeeId, db) || goal.employeeId === actor.id) {
    return fail("Only the manager can approve this goal.");
  }
  if (goal.approvalStatus !== "pending_approval" && actor.role !== "admin") {
    return fail("This goal is not waiting for approval.");
  }
  goal.approvalStatus = decision;
  goal.managerComment = comment.trim();
  goal.reviewedAt = new Date().toISOString();
  persistDb();
  return ok(true);
}

export async function updateGoalProgress(input: {
  goalId: string;
  status: GoalStatus;
  currentValue: number;
}): Promise<Result<true>> {
  const actor = await requireActor();
  const db = getDb();
  const goal = db.goals.find((g) => g.id === input.goalId);
  if (!goal) return fail("Goal not found.");
  if (!canAccess(actor, goal.employeeId, db)) return fail("You cannot update this goal.");
  if (goal.approvalStatus !== "approved" && goal.employeeId === actor.id) {
    return fail("Goal must be approved before tracking progress.");
  }
  goal.status = input.status;
  const kr = db.keyResults.find((k) => k.goalId === goal.id);
  if (kr) kr.currentValue = input.currentValue;
  persistDb();
  return ok(true);
}

export async function listAppraisals() {
  const actor = await requireActor();
  const db = getDb();
  const appraisals = db.appraisals.filter((a) => canAccess(actor, a.employeeId, db));
  return { actor, appraisals, people: peopleOf(db), cycles: db.cycles };
}

export async function getAppraisal(appraisalId: string) {
  const actor = await requireActor();
  const db = getDb();
  const appraisal = db.appraisals.find((a) => a.id === appraisalId);
  if (!appraisal || !canAccess(actor, appraisal.employeeId, db)) {
    return { actor, appraisal: null, error: "Review not found." };
  }
  return {
    actor,
    appraisal,
    scores: db.appraisalScores.filter((s) => s.appraisalId === appraisal.id),
    people: peopleOf(db),
    cycle: db.cycles.find((c) => c.id === appraisal.cycleId) ?? null,
    error: null,
  };
}

export async function saveSelfAppraisal(input: {
  appraisalId: string;
  summary: string;
  rating: number | null;
  scores: { id: string; value: number | null }[];
  submit: boolean;
}): Promise<Result<true>> {
  const actor = await requireActor();
  const db = getDb();
  const appraisal = db.appraisals.find((a) => a.id === input.appraisalId);
  if (!appraisal) return fail("Review not found.");
  if (appraisal.employeeId !== actor.id) return fail("Only the employee can complete the self-appraisal.");
  appraisal.selfSummary = input.summary;
  appraisal.selfRating = input.rating;
  appraisal.selfStatus = input.submit ? "submitted" : "in_progress";
  if (input.submit) appraisal.selfSubmittedAt = new Date().toISOString();
  for (const score of input.scores) {
    const row = db.appraisalScores.find((s) => s.id === score.id);
    if (row) row.selfScore = score.value;
  }
  persistDb();
  return ok(true);
}

export async function saveManagerAppraisal(input: {
  appraisalId: string;
  summary: string;
  rating: number | null;
  scores: { id: string; value: number | null }[];
  submit: boolean;
}): Promise<Result<true>> {
  const actor = await requireActor();
  const db = getDb();
  const appraisal = db.appraisals.find((a) => a.id === input.appraisalId);
  if (!appraisal) return fail("Review not found.");
  if (appraisal.managerId !== actor.id && actor.role !== "admin") {
    return fail("Only the manager can complete this assessment.");
  }
  if (appraisal.selfStatus !== "submitted" && appraisal.selfStatus !== "completed") {
    return fail("Self-appraisal must be submitted first.");
  }
  appraisal.managerSummary = input.summary;
  appraisal.managerRating = input.rating;
  appraisal.managerStatus = input.submit ? "completed" : "in_progress";
  if (input.submit) {
    appraisal.managerSubmittedAt = new Date().toISOString();
    appraisal.selfStatus = "completed";
  }
  for (const score of input.scores) {
    const row = db.appraisalScores.find((s) => s.id === score.id);
    if (row) row.managerScore = score.value;
  }
  persistDb();
  return ok(true);
}

export async function listKudos() {
  const actor = await requireActor();
  const db = getDb();
  return {
    actor,
    kudos: [...db.kudos].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    people: peopleOf(db),
  };
}

export async function postKudo(toEmployeeId: string, badge: string, message: string): Promise<Result<true>> {
  const actor = await requireActor();
  if (!toEmployeeId || !message.trim() || !badge.trim()) return fail("Choose a colleague, badge, and message.");
  if (toEmployeeId === actor.id) return fail("Kudos must go to a colleague.");
  getDb().kudos.unshift({
    id: id(),
    fromEmployeeId: actor.id,
    toEmployeeId,
    badge: badge.trim(),
    message: message.trim(),
    createdAt: new Date().toISOString(),
  });
  persistDb();
  return ok(true);
}

export async function radar() {
  const actor = await requireActor();
  if (actor.role === "employee") {
    return { actor, rows: [], error: "Flight Risk Radar is available to managers and people partners." };
  }
  return { actor, rows: flightRisk(getDb(), actor), error: null };
}

export async function heatmap() {
  const actor = await requireActor();
  const db = getDb();
  const visiblePeople = peopleOf(db).filter((p) => canAccess(actor, p.id, db));
  return {
    actor,
    people: visiblePeople,
    skills: db.skills,
    benchmarks: db.benchmarks,
    employeeSkills: db.employeeSkills.filter((s) => visiblePeople.some((p) => p.id === s.employeeId)),
  };
}

export async function dashboard() {
  const actor = await requireActor();
  const db = getDb();
  const cycle = db.cycles.find((c) => c.status === "active") ?? null;
  const goals = db.goals.filter((g) => g.employeeId === actor.id && g.cycleId === cycle?.id);
  const appraisals = db.appraisals.filter((a) => canAccess(actor, a.employeeId, db));
  const kudos = db.kudos.filter((k) => k.toEmployeeId === actor.id).slice(0, 4);
  return { actor, cycle, goals, appraisals, kudos, people: peopleOf(db), keyResults: db.keyResults };
}

export type { Actor } from "./types";
