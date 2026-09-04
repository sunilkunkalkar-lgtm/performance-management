import type { SupabaseClient } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import {
  mapAppraisal,
  mapAppraisalScore,
  mapEmployee,
  mapEmployeeSkill,
  mapFlightRiskRow,
  mapGoal,
  mapKeyResult,
  mapKudo,
  mapPerson,
  mapProfile,
  mapReviewCycle,
  mapRoleBenchmark,
  mapSkill,
  toGoalInsert,
  toKeyResultInsert,
  toKudoInsert,
} from "@/lib/supabase/mappers";
import { clerkEnabled, supabaseEnabled } from "./config";
import { getDb, persistDb } from "./context";
import { actorFromClerkId, canAccess, fail, flightRisk, ok, peopleOf, type Db } from "./seed";
import type {
  Actor,
  Appraisal,
  AppraisalScore,
  ApprovalStatus,
  FlightRiskRow,
  Goal,
  GoalStatus,
  KeyResult,
  Kudo,
  Person,
  Result,
  ReviewCycle,
} from "./types";

export type TypedSupabaseClient = SupabaseClient<Database>;

export async function getSupabaseClient(): Promise<TypedSupabaseClient | null> {
  if (!clerkEnabled() || !supabaseEnabled()) return null;
  const { auth } = await import("@clerk/nextjs/server");
  return createServerSupabaseClient(async () => {
    const session = await auth();
    return session.getToken();
  });
}

async function loadDbFromSupabase(client: TypedSupabaseClient): Promise<Db> {
  const [
    profilesRes,
    employeesRes,
    cyclesRes,
    goalsRes,
    keyResultsRes,
    appraisalsRes,
    appraisalScoresRes,
    checkInsRes,
    kudosRes,
    skillsRes,
    benchmarksRes,
    employeeSkillsRes,
  ] = await Promise.all([
    client.from("profiles").select("*"),
    client.from("employees").select("*"),
    client.from("review_cycles").select("*"),
    client.from("goals").select("*"),
    client.from("key_results").select("*"),
    client.from("appraisals").select("*"),
    client.from("appraisal_scores").select("*"),
    client.from("check_ins").select("*"),
    client.from("kudos").select("*").order("created_at", { ascending: false }),
    client.from("skills").select("*"),
    client.from("role_skill_benchmarks").select("*"),
    client.from("employee_skills").select("*"),
  ]);

  const tables = [
  profilesRes,
  employeesRes,
  cyclesRes,
  goalsRes,
  keyResultsRes,
  appraisalsRes,
  appraisalScoresRes,
  checkInsRes,
  kudosRes,
  skillsRes,
  benchmarksRes,
  employeeSkillsRes,
  ];
  for (const res of tables) {
    if (res.error) throw new Error(res.error.message);
  }

  return {
    profiles: (profilesRes.data ?? []).map(mapProfile),
    employees: (employeesRes.data ?? []).map(mapEmployee),
    cycles: (cyclesRes.data ?? []).map(mapReviewCycle),
    goals: (goalsRes.data ?? []).map(mapGoal),
    keyResults: (keyResultsRes.data ?? []).map(mapKeyResult),
    appraisals: (appraisalsRes.data ?? []).map(mapAppraisal),
    appraisalScores: (appraisalScoresRes.data ?? []).map(mapAppraisalScore),
    checkIns: (checkInsRes.data ?? []).map((row) => ({
      id: row.id,
      employeeId: row.employee_id,
      cycleId: row.cycle_id,
      scheduledAt: row.scheduled_at,
      completedAt: row.completed_at,
      status: row.status,
      notes: row.notes,
    })),
    kudos: (kudosRes.data ?? []).map(mapKudo),
    skills: (skillsRes.data ?? []).map(mapSkill),
    benchmarks: (benchmarksRes.data ?? []).map(mapRoleBenchmark),
    employeeSkills: (employeeSkillsRes.data ?? []).map(mapEmployeeSkill),
  };
}

export async function readDb(): Promise<Db> {
  const client = await getSupabaseClient();
  if (!client) return getDb();
  return loadDbFromSupabase(client);
}

export async function getActorFromStore(clerkId: string): Promise<Actor | null> {
  const client = await getSupabaseClient();
  if (!client) return actorFromClerkId(getDb(), clerkId);

  const { data: profile, error: profileError } = await client
    .from("profiles")
    .select("*")
    .eq("clerk_id", clerkId)
    .maybeSingle();
  if (profileError) throw new Error(profileError.message);
  if (!profile) return null;

  const { data: employee, error: employeeError } = await client
    .from("employees")
    .select("*")
    .eq("profile_id", profile.id)
    .maybeSingle();
  if (employeeError) throw new Error(employeeError.message);
  if (!employee) return null;

  return mapPerson(employee, profile);
}

export async function linkClerkProfile(input: {
  clerkId: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
}): Promise<Actor | null> {
  const client = await getSupabaseClient();
  if (!client) {
    const db = getDb();
    const profile = db.profiles.find((p) => p.email === input.email);
    if (!profile) return null;
    profile.clerkId = input.clerkId;
    persistDb();
    return actorFromClerkId(db, input.clerkId);
  }

  const { data: existing, error: existingError } = await client
    .from("profiles")
    .select("id")
    .eq("email", input.email)
    .maybeSingle();
  if (existingError) throw new Error(existingError.message);

  if (existing) {
    const { error } = await client
      .from("profiles")
      .update({
        clerk_id: input.clerkId,
        full_name: input.fullName,
        avatar_url: input.avatarUrl,
      })
      .eq("id", existing.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await client.from("profiles").insert({
      clerk_id: input.clerkId,
      email: input.email,
      full_name: input.fullName,
      role: "employee",
      avatar_url: input.avatarUrl,
    });
    if (error) throw new Error(error.message);
  }

  return getActorFromStore(input.clerkId);
}

export async function listPeopleStore(): Promise<Person[]> {
  const db = await readDb();
  return peopleOf(db);
}

export async function listCyclesStore(): Promise<ReviewCycle[]> {
  const db = await readDb();
  return db.cycles;
}

export async function activeCycleStore(): Promise<ReviewCycle | null> {
  const db = await readDb();
  return db.cycles.find((c) => c.status === "active") ?? null;
}

export async function listGoalsStore(actor: Actor) {
  const db = await readDb();
  const manager = db.employees.find((e) => e.id === actor.managerId);
  const skip = manager?.managerId;
  const goals = db.goals.filter((g) => {
    if (canAccess(actor, g.employeeId, db)) return true;
    if (g.approvalStatus !== "approved") return false;
    return g.employeeId === actor.managerId || (skip != null && g.employeeId === skip);
  });
  return {
    goals,
    keyResults: db.keyResults,
    people: peopleOf(db),
    cycles: db.cycles,
  };
}

export async function getGoalStore(actor: Actor, goalId: string) {
  const db = await readDb();
  const goal = db.goals.find((g) => g.id === goalId);
  if (!goal) return { goal: null, error: "Goal not found." };
  const manager = db.employees.find((e) => e.id === actor.managerId);
  const skip = manager?.managerId;
  const canRead =
    canAccess(actor, goal.employeeId, db) ||
    (goal.approvalStatus === "approved" &&
      (goal.employeeId === actor.managerId || (skip != null && goal.employeeId === skip)));
  if (!canRead) return { goal: null, error: "You do not have access to this goal." };
  return {
    goal,
    keyResults: db.keyResults.filter((k) => k.goalId === goal.id),
    people: peopleOf(db),
    parent: goal.parentGoalId ? db.goals.find((g) => g.id === goal.parentGoalId) ?? null : null,
    error: null,
  };
}

function id() {
  return crypto.randomUUID();
}

export async function createGoalStore(
  actor: Actor,
  input: {
    title: string;
    description: string;
    parentGoalId: string | null;
    weight: number;
    dueDate: string;
    krTitle: string;
    krTarget: number;
    krUnit: string;
  },
): Promise<Result<{ id: string }>> {
  const cycle = await activeCycleStore();
  if (!cycle) return fail("No active review cycle.");
  if (!input.title.trim() || !input.description.trim()) return fail("Title and description are required.");

  const goalId = id();
  const now = new Date().toISOString();
  const goal: Goal = {
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
  };

  const client = await getSupabaseClient();
  if (!client) {
    const db = getDb();
    db.goals.push(goal);
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

  const { error: goalError } = await client.from("goals").insert(toGoalInsert(goal));
  if (goalError) return fail(goalError.message);

  if (input.krTitle.trim()) {
    const { error: krError } = await client.from("key_results").insert(
      toKeyResultInsert({
        goalId,
        title: input.krTitle.trim(),
        metric: input.krTitle.trim(),
        target: input.krTarget || 1,
        currentValue: 0,
        unit: input.krUnit.trim() || "units",
        sortOrder: 1,
      }),
    );
    if (krError) return fail(krError.message);
  }

  return ok({ id: goalId });
}

export async function submitGoalStore(actor: Actor, goalId: string): Promise<Result<true>> {
  const client = await getSupabaseClient();
  if (!client) {
    const db = getDb();
    const goal = db.goals.find((g) => g.id === goalId);
    if (!goal) return fail("Goal not found.");
    if (goal.employeeId !== actor.id && actor.role !== "admin") return fail("Only the owner can submit this goal.");
    goal.approvalStatus = "pending_approval";
    goal.submittedAt = new Date().toISOString();
    persistDb();
    return ok(true);
  }

  const { data: goal, error: readError } = await client.from("goals").select("*").eq("id", goalId).maybeSingle();
  if (readError) return fail(readError.message);
  if (!goal) return fail("Goal not found.");
  if (goal.employee_id !== actor.id && actor.role !== "admin") return fail("Only the owner can submit this goal.");

  const { error } = await client
    .from("goals")
    .update({ approval_status: "pending_approval", submitted_at: new Date().toISOString() })
    .eq("id", goalId);
  if (error) return fail(error.message);
  return ok(true);
}

export async function decideGoalStore(
  actor: Actor,
  goalId: string,
  decision: Extract<ApprovalStatus, "approved" | "rejected">,
  comment: string,
): Promise<Result<true>> {
  const db = await readDb();
  const goal = db.goals.find((g) => g.id === goalId);
  if (!goal) return fail("Goal not found.");
  if (!canAccess(actor, goal.employeeId, db) || goal.employeeId === actor.id) {
    return fail("Only the manager can approve this goal.");
  }
  if (goal.approvalStatus !== "pending_approval" && actor.role !== "admin") {
    return fail("This goal is not waiting for approval.");
  }

  const client = await getSupabaseClient();
  if (!client) {
    goal.approvalStatus = decision;
    goal.managerComment = comment.trim();
    goal.reviewedAt = new Date().toISOString();
    persistDb();
    return ok(true);
  }

  const { error } = await client
    .from("goals")
    .update({
      approval_status: decision,
      manager_comment: comment.trim(),
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", goalId);
  if (error) return fail(error.message);
  return ok(true);
}

export async function updateGoalProgressStore(
  actor: Actor,
  input: { goalId: string; status: GoalStatus; currentValue: number },
): Promise<Result<true>> {
  const db = await readDb();
  const goal = db.goals.find((g) => g.id === input.goalId);
  if (!goal) return fail("Goal not found.");
  if (!canAccess(actor, goal.employeeId, db)) return fail("You cannot update this goal.");
  if (goal.approvalStatus !== "approved" && goal.employeeId === actor.id) {
    return fail("Goal must be approved before tracking progress.");
  }

  const client = await getSupabaseClient();
  if (!client) {
    goal.status = input.status;
    const kr = db.keyResults.find((k) => k.goalId === goal.id);
    if (kr) kr.currentValue = input.currentValue;
    persistDb();
    return ok(true);
  }

  const { error: goalError } = await client.from("goals").update({ status: input.status }).eq("id", input.goalId);
  if (goalError) return fail(goalError.message);

  const kr = db.keyResults.find((k) => k.goalId === goal.id);
  if (kr) {
    const { error: krError } = await client
      .from("key_results")
      .update({ current_value: input.currentValue })
      .eq("id", kr.id);
    if (krError) return fail(krError.message);
  }

  return ok(true);
}

export async function listAppraisalsStore(actor: Actor) {
  const db = await readDb();
  const appraisals = db.appraisals.filter((a) => canAccess(actor, a.employeeId, db));
  return { appraisals, people: peopleOf(db), cycles: db.cycles };
}

export async function getAppraisalStore(actor: Actor, appraisalId: string) {
  const db = await readDb();
  const appraisal = db.appraisals.find((a) => a.id === appraisalId);
  if (!appraisal || !canAccess(actor, appraisal.employeeId, db)) {
    return { appraisal: null, error: "Review not found." };
  }
  return {
    appraisal,
    scores: db.appraisalScores.filter((s) => s.appraisalId === appraisal.id),
    people: peopleOf(db),
    cycle: db.cycles.find((c) => c.id === appraisal.cycleId) ?? null,
    error: null,
  };
}

async function updateAppraisalScores(
  client: TypedSupabaseClient | null,
  db: Db,
  scores: { id: string; value: number | null }[],
  field: "selfScore" | "managerScore",
) {
  for (const score of scores) {
    const row = db.appraisalScores.find((s) => s.id === score.id);
    if (!row) continue;
    row[field] = score.value;
    if (client) {
      const { error } =
        field === "selfScore"
          ? await client.from("appraisal_scores").update({ self_score: score.value }).eq("id", score.id)
          : await client.from("appraisal_scores").update({ manager_score: score.value }).eq("id", score.id);
      if (error) throw new Error(error.message);
    }
  }
}

export async function saveSelfAppraisalStore(
  actor: Actor,
  input: {
    appraisalId: string;
    summary: string;
    rating: number | null;
    scores: { id: string; value: number | null }[];
    submit: boolean;
  },
): Promise<Result<true>> {
  const db = await readDb();
  const appraisal = db.appraisals.find((a) => a.id === input.appraisalId);
  if (!appraisal) return fail("Review not found.");
  if (appraisal.employeeId !== actor.id) return fail("Only the employee can complete the self-appraisal.");

  const client = await getSupabaseClient();
  appraisal.selfSummary = input.summary;
  appraisal.selfRating = input.rating;
  appraisal.selfStatus = input.submit ? "submitted" : "in_progress";
  if (input.submit) appraisal.selfSubmittedAt = new Date().toISOString();

  try {
    await updateAppraisalScores(client, db, input.scores, "selfScore");
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Failed to save scores.");
  }

  if (client) {
    const { error } = await client
      .from("appraisals")
      .update({
        self_summary: appraisal.selfSummary,
        self_rating: appraisal.selfRating,
        self_status: appraisal.selfStatus,
        self_submitted_at: appraisal.selfSubmittedAt,
      })
      .eq("id", appraisal.id);
    if (error) return fail(error.message);
  } else {
    persistDb();
  }

  return ok(true);
}

export async function saveManagerAppraisalStore(
  actor: Actor,
  input: {
    appraisalId: string;
    summary: string;
    rating: number | null;
    scores: { id: string; value: number | null }[];
    submit: boolean;
  },
): Promise<Result<true>> {
  const db = await readDb();
  const appraisal = db.appraisals.find((a) => a.id === input.appraisalId);
  if (!appraisal) return fail("Review not found.");
  if (appraisal.managerId !== actor.id && actor.role !== "admin") {
    return fail("Only the manager can complete this assessment.");
  }
  if (appraisal.selfStatus !== "submitted" && appraisal.selfStatus !== "completed") {
    return fail("Self-appraisal must be submitted first.");
  }

  const client = await getSupabaseClient();
  appraisal.managerSummary = input.summary;
  appraisal.managerRating = input.rating;
  appraisal.managerStatus = input.submit ? "completed" : "in_progress";
  if (input.submit) {
    appraisal.managerSubmittedAt = new Date().toISOString();
    appraisal.selfStatus = "completed";
  }

  try {
    await updateAppraisalScores(client, db, input.scores, "managerScore");
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Failed to save scores.");
  }

  if (client) {
    const { error } = await client
      .from("appraisals")
      .update({
        manager_summary: appraisal.managerSummary,
        manager_rating: appraisal.managerRating,
        manager_status: appraisal.managerStatus,
        manager_submitted_at: appraisal.managerSubmittedAt,
        self_status: appraisal.selfStatus,
      })
      .eq("id", appraisal.id);
    if (error) return fail(error.message);
  } else {
    persistDb();
  }

  return ok(true);
}

export async function listKudosStore() {
  const db = await readDb();
  return {
    kudos: [...db.kudos].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    people: peopleOf(db),
  };
}

export async function postKudoStore(
  actor: Actor,
  toEmployeeId: string,
  badge: string,
  message: string,
): Promise<Result<true>> {
  if (!toEmployeeId || !message.trim() || !badge.trim()) return fail("Choose a colleague, badge, and message.");
  if (toEmployeeId === actor.id) return fail("Kudos must go to a colleague.");

  const kudo: Kudo = {
    id: id(),
    fromEmployeeId: actor.id,
    toEmployeeId,
    badge: badge.trim(),
    message: message.trim(),
    createdAt: new Date().toISOString(),
  };

  const client = await getSupabaseClient();
  if (!client) {
    getDb().kudos.unshift(kudo);
    persistDb();
    return ok(true);
  }

  const { error } = await client.from("kudos").insert(toKudoInsert(kudo));
  if (error) return fail(error.message);
  return ok(true);
}

export async function radarStore(actor: Actor): Promise<{ rows: FlightRiskRow[]; error: string | null }> {
  if (actor.role === "employee") {
    return { rows: [], error: "Flight Risk Radar is available to managers and people partners." };
  }

  const client = await getSupabaseClient();
  if (!client) {
    return { rows: flightRisk(getDb(), actor), error: null };
  }

  const { data, error } = await client.from("flight_risk_radar").select("*");
  if (error) return { rows: [], error: error.message };

  let rows = (data ?? []).map(mapFlightRiskRow);
  if (actor.role === "manager") {
    rows = rows.filter((row) => row.managerId === actor.id);
  } else if (actor.role === "admin") {
    rows = rows.filter((row) => row.employeeId !== actor.id);
  }
  return { rows: rows.sort((a, b) => b.riskScore - a.riskScore), error: null };
}

export async function heatmapStore(actor: Actor) {
  const db = await readDb();
  const visiblePeople = peopleOf(db).filter((p) => canAccess(actor, p.id, db));
  return {
    people: visiblePeople,
    skills: db.skills,
    benchmarks: db.benchmarks,
    employeeSkills: db.employeeSkills.filter((s) => visiblePeople.some((p) => p.id === s.employeeId)),
  };
}

export async function dashboardStore(actor: Actor) {
  const db = await readDb();
  const cycle = db.cycles.find((c) => c.status === "active") ?? null;
  const goals = db.goals.filter((g) => g.employeeId === actor.id && g.cycleId === cycle?.id);
  const appraisals = db.appraisals.filter((a) => canAccess(actor, a.employeeId, db));
  const kudos = db.kudos.filter((k) => k.toEmployeeId === actor.id).slice(0, 4);
  return { cycle, goals, appraisals, kudos, people: peopleOf(db), keyResults: db.keyResults };
}

export type { Appraisal, AppraisalScore, Goal, KeyResult, Kudo, Person, ReviewCycle };
