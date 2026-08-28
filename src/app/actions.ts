"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { GoalStatus, ReviewStatus } from "@prisma/client";
import { login, logout, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const result = await login(email, password);
  if ("error" in result && result.error) {
    redirect(`/login?error=${encodeURIComponent(result.error)}`);
  }
  redirect("/dashboard");
}

export async function logoutAction() {
  await logout();
  redirect("/login");
}

export async function createGoalAction(formData: FormData) {
  const user = await requireUser();
  const cycle = await prisma.cycle.findFirst({ where: { status: "ACTIVE" } });
  if (!cycle) redirect("/goals");

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const metric = String(formData.get("metric") ?? "").trim();
  const unit = String(formData.get("unit") ?? "").trim();
  const target = Number(formData.get("target") ?? 0);
  const weight = Number(formData.get("weight") ?? 25);
  const dueDate = String(formData.get("dueDate") ?? "");
  const level = String(formData.get("level") ?? "INDIVIDUAL") as
    | "COMPANY"
    | "TEAM"
    | "INDIVIDUAL";

  if (!title || !description || !metric || !dueDate) {
    redirect("/goals/new?error=Please+complete+the+required+fields.");
  }

  await prisma.goal.create({
    data: {
      ownerId: user.id,
      cycleId: cycle.id,
      title,
      description,
      metric,
      unit: unit || "units",
      target,
      current: 0,
      weight,
      dueDate: new Date(dueDate),
      level,
      status: GoalStatus.ON_TRACK,
    },
  });

  revalidatePath("/goals");
  revalidatePath("/dashboard");
  redirect("/goals");
}

export async function updateGoalProgressAction(formData: FormData) {
  const user = await requireUser();
  const goalId = String(formData.get("goalId") ?? "");
  const progress = Number(formData.get("progress") ?? 0);
  const note = String(formData.get("note") ?? "").trim();
  const status = String(formData.get("status") ?? "ON_TRACK") as GoalStatus;

  const goal = await prisma.goal.findUnique({ where: { id: goalId } });
  if (!goal) redirect("/goals");
  if (goal.ownerId !== user.id && user.role === "EMPLOYEE") redirect("/goals");

  await prisma.goal.update({
    where: { id: goalId },
    data: { current: progress, status },
  });
  if (note) {
    await prisma.goalUpdate.create({
      data: { goalId, authorId: user.id, note, progress },
    });
  }
  revalidatePath(`/goals/${goalId}`);
  revalidatePath("/goals");
  revalidatePath("/dashboard");
  redirect(`/goals/${goalId}`);
}

export async function sendFeedbackAction(formData: FormData) {
  const user = await requireUser();
  const toId = String(formData.get("toId") ?? "");
  const message = String(formData.get("message") ?? "").trim();
  if (!toId || !message) redirect("/feedback?error=Choose+a+colleague+and+write+feedback.");
  if (toId === user.id) redirect("/feedback?error=Feedback+must+go+to+someone+else.");

  await prisma.feedback.create({
    data: { fromId: user.id, toId, message, shared: true },
  });
  revalidatePath("/feedback");
  revalidatePath("/dashboard");
  redirect("/feedback");
}

export async function saveSelfReviewAction(formData: FormData) {
  const user = await requireUser();
  const reviewId = String(formData.get("reviewId") ?? "");
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    include: { competencies: true },
  });
  if (!review || review.employeeId !== user.id) redirect("/reviews");

  const selfSummary = String(formData.get("selfSummary") ?? "").trim();
  const selfRating = Number(formData.get("selfRating") ?? 0) || null;
  const submit = String(formData.get("intent") ?? "") === "submit";

  await prisma.review.update({
    where: { id: reviewId },
    data: {
      selfSummary,
      selfRating,
      status: submit ? ReviewStatus.MANAGER_REVIEW : ReviewStatus.SELF_REVIEW,
    },
  });

  for (const competency of review.competencies) {
    const value = Number(formData.get(`self-${competency.id}`) ?? 0) || null;
    await prisma.competencyRating.update({
      where: { id: competency.id },
      data: { selfScore: value },
    });
  }

  revalidatePath(`/reviews/${reviewId}`);
  revalidatePath("/reviews");
  redirect(`/reviews/${reviewId}`);
}

export async function saveManagerReviewAction(formData: FormData) {
  const user = await requireUser();
  const reviewId = String(formData.get("reviewId") ?? "");
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    include: { competencies: true },
  });
  if (!review) redirect("/reviews");
  const canWrite =
    review.managerId === user.id || user.role === "ADMIN";
  if (!canWrite) redirect("/reviews");

  const managerSummary = String(formData.get("managerSummary") ?? "").trim();
  const managerRating = Number(formData.get("managerRating") ?? 0) || null;
  const submit = String(formData.get("intent") ?? "") === "submit";

  await prisma.review.update({
    where: { id: reviewId },
    data: {
      managerSummary,
      managerRating,
      status: submit ? ReviewStatus.COMPLETED : ReviewStatus.MANAGER_REVIEW,
    },
  });

  for (const competency of review.competencies) {
    const value = Number(formData.get(`mgr-${competency.id}`) ?? 0) || null;
    await prisma.competencyRating.update({
      where: { id: competency.id },
      data: { managerScore: value },
    });
  }

  revalidatePath(`/reviews/${reviewId}`);
  revalidatePath("/reviews");
  redirect(`/reviews/${reviewId}`);
}
