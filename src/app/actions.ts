"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, signSession } from "@/lib/session";
import { getDb, resetDb } from "@/lib/pms/context";
import {
  createGoal,
  decideGoal,
  postKudo,
  saveManagerAppraisal,
  saveSelfAppraisal,
  submitGoal,
  updateGoalProgress,
} from "@/lib/pms/queries";
import type { GoalStatus } from "@/lib/pms/types";

export async function demoLoginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "")
    .toLowerCase()
    .trim();
  const profile = getDb().profiles.find((p) => p.email === email);
  if (!profile) redirect("/login?error=" + encodeURIComponent("Unknown demo account."));
  const jar = await cookies();
  jar.set(SESSION_COOKIE, signSession(profile.clerkId), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
  redirect("/dashboard");
}

export async function logoutAction() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  redirect("/login");
}

export async function resetDemoAction() {
  resetDb();
  revalidatePath("/");
  redirect("/dashboard");
}

export async function createGoalAction(formData: FormData) {
  const result = await createGoal({
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    parentGoalId: String(formData.get("parentGoalId") ?? "") || null,
    weight: Number(formData.get("weight") ?? 25),
    dueDate: String(formData.get("dueDate") ?? ""),
    krTitle: String(formData.get("krTitle") ?? ""),
    krTarget: Number(formData.get("krTarget") ?? 1),
    krUnit: String(formData.get("krUnit") ?? ""),
  });
  if (result.error || !result.data) redirect("/goals/new?error=" + encodeURIComponent(result.error ?? "Could not save goal."));
  revalidatePath("/goals");
  redirect(`/goals/${result.data.id}`);
}

export async function submitGoalAction(formData: FormData) {
  const id = String(formData.get("goalId") ?? "");
  const result = await submitGoal(id);
  if (result.error) redirect(`/goals/${id}?error=${encodeURIComponent(result.error)}`);
  revalidatePath(`/goals/${id}`);
  redirect(`/goals/${id}`);
}

export async function decideGoalAction(formData: FormData) {
  const id = String(formData.get("goalId") ?? "");
  const decision = String(formData.get("decision") ?? "") as "approved" | "rejected";
  const comment = String(formData.get("comment") ?? "");
  const result = await decideGoal(id, decision, comment);
  if (result.error) redirect(`/goals/${id}?error=${encodeURIComponent(result.error)}`);
  revalidatePath(`/goals/${id}`);
  redirect(`/goals/${id}`);
}

export async function updateProgressAction(formData: FormData) {
  const id = String(formData.get("goalId") ?? "");
  const result = await updateGoalProgress({
    goalId: id,
    status: String(formData.get("status") ?? "in_progress") as GoalStatus,
    currentValue: Number(formData.get("currentValue") ?? 0),
  });
  if (result.error) redirect(`/goals/${id}?error=${encodeURIComponent(result.error)}`);
  revalidatePath(`/goals/${id}`);
  redirect(`/goals/${id}`);
}

export async function saveSelfReviewAction(formData: FormData) {
  const id = String(formData.get("appraisalId") ?? "");
  const scoreIds = formData.getAll("scoreId").map(String);
  const result = await saveSelfAppraisal({
    appraisalId: id,
    summary: String(formData.get("selfSummary") ?? ""),
    rating: Number(formData.get("selfRating") ?? 0) || null,
    scores: scoreIds.map((scoreId) => ({
      id: scoreId,
      value: Number(formData.get(`self-${scoreId}`) ?? 0) || null,
    })),
    submit: String(formData.get("intent") ?? "") === "submit",
  });
  if (result.error) redirect(`/reviews/${id}?error=${encodeURIComponent(result.error)}`);
  revalidatePath(`/reviews/${id}`);
  redirect(`/reviews/${id}`);
}

export async function saveManagerReviewAction(formData: FormData) {
  const id = String(formData.get("appraisalId") ?? "");
  const scoreIds = formData.getAll("scoreId").map(String);
  const result = await saveManagerAppraisal({
    appraisalId: id,
    summary: String(formData.get("managerSummary") ?? ""),
    rating: Number(formData.get("managerRating") ?? 0) || null,
    scores: scoreIds.map((scoreId) => ({
      id: scoreId,
      value: Number(formData.get(`mgr-${scoreId}`) ?? 0) || null,
    })),
    submit: String(formData.get("intent") ?? "") === "submit",
  });
  if (result.error) redirect(`/reviews/${id}?error=${encodeURIComponent(result.error)}`);
  revalidatePath(`/reviews/${id}`);
  redirect(`/reviews/${id}`);
}

export async function sendKudoAction(formData: FormData) {
  const result = await postKudo(
    String(formData.get("toId") ?? ""),
    String(formData.get("badge") ?? ""),
    String(formData.get("message") ?? ""),
  );
  if (result.error) redirect(`/kudos?error=${encodeURIComponent(result.error)}`);
  revalidatePath("/kudos");
  redirect("/kudos");
}
