import { requireActor } from "./context";
import {
  activeCycleStore,
  createGoalStore,
  dashboardStore,
  decideGoalStore,
  getAppraisalStore,
  getGoalStore,
  heatmapStore,
  listAppraisalsStore,
  listCyclesStore,
  listGoalsStore,
  listKudosStore,
  listPeopleStore,
  postKudoStore,
  radarStore,
  saveManagerAppraisalStore,
  saveSelfAppraisalStore,
  submitGoalStore,
  updateGoalProgressStore,
} from "./repository";
import type { ApprovalStatus, GoalStatus, Result } from "./types";

export async function listPeople() {
  const actor = await requireActor();
  return { actor, people: await listPeopleStore() };
}

export async function listCycles() {
  const actor = await requireActor();
  return { actor, cycles: await listCyclesStore() };
}

export async function activeCycle() {
  return activeCycleStore();
}

export async function listGoalsForActor() {
  const actor = await requireActor();
  const data = await listGoalsStore(actor);
  return { actor, ...data };
}

export async function getGoal(goalId: string) {
  const actor = await requireActor();
  const result = await getGoalStore(actor, goalId);
  return { actor, ...result };
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
  return createGoalStore(actor, input);
}

export async function submitGoal(goalId: string): Promise<Result<true>> {
  const actor = await requireActor();
  return submitGoalStore(actor, goalId);
}

export async function decideGoal(
  goalId: string,
  decision: Extract<ApprovalStatus, "approved" | "rejected">,
  comment: string,
): Promise<Result<true>> {
  const actor = await requireActor();
  return decideGoalStore(actor, goalId, decision, comment);
}

export async function updateGoalProgress(input: {
  goalId: string;
  status: GoalStatus;
  currentValue: number;
}): Promise<Result<true>> {
  const actor = await requireActor();
  return updateGoalProgressStore(actor, input);
}

export async function listAppraisals() {
  const actor = await requireActor();
  const data = await listAppraisalsStore(actor);
  return { actor, ...data };
}

export async function getAppraisal(appraisalId: string) {
  const actor = await requireActor();
  const result = await getAppraisalStore(actor, appraisalId);
  return { actor, ...result };
}

export async function saveSelfAppraisal(input: {
  appraisalId: string;
  summary: string;
  rating: number | null;
  scores: { id: string; value: number | null }[];
  submit: boolean;
}): Promise<Result<true>> {
  const actor = await requireActor();
  return saveSelfAppraisalStore(actor, input);
}

export async function saveManagerAppraisal(input: {
  appraisalId: string;
  summary: string;
  rating: number | null;
  scores: { id: string; value: number | null }[];
  submit: boolean;
}): Promise<Result<true>> {
  const actor = await requireActor();
  return saveManagerAppraisalStore(actor, input);
}

export async function listKudos() {
  const actor = await requireActor();
  const data = await listKudosStore();
  return { actor, ...data };
}

export async function postKudo(toEmployeeId: string, badge: string, message: string): Promise<Result<true>> {
  const actor = await requireActor();
  return postKudoStore(actor, toEmployeeId, badge, message);
}

export async function radar() {
  const actor = await requireActor();
  const { rows, error } = await radarStore(actor);
  return { actor, rows, error };
}

export async function heatmap() {
  const actor = await requireActor();
  const data = await heatmapStore(actor);
  return { actor, ...data };
}

export async function dashboard() {
  const actor = await requireActor();
  const data = await dashboardStore(actor);
  return { actor, ...data };
}

export type { Actor } from "./types";
