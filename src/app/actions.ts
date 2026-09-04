"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, signSession } from "@/lib/session";
import { resetDb, getDb } from "@/lib/pms/context";
import { dashboardPathForRole } from "@/lib/pms/rbac";
import { actorFromClerkId } from "@/lib/pms/seed";
import {
  addTaskComment,
  authenticate,
  createEmployee,
  createTask,
  deleteEmployee,
  toggleTaskBlocker,
  updateEmployee,
  updateTaskStatus,
} from "@/lib/pms/queries";
import type { TaskPriority, TaskStatus } from "@/lib/pms/types";

async function dashboardForSession() {
  const jar = await cookies();
  const clerkId = jar.get(SESSION_COOKIE)?.value;
  if (!clerkId) return "/login";
  const { readSessionUserId } = await import("@/lib/session");
  const userId = readSessionUserId(clerkId);
  if (!userId) return "/login";
  const actor = actorFromClerkId(getDb(), userId);
  return actor ? dashboardPathForRole(actor.role) : "/login";
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const result = await authenticate(email, password);
  if (result.error || !result.data) {
    redirect("/login?error=" + encodeURIComponent(result.error ?? "Sign in failed."));
  }
  const jar = await cookies();
  jar.set(SESSION_COOKIE, signSession(result.data), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
  const actor = actorFromClerkId(getDb(), result.data);
  redirect(actor ? dashboardPathForRole(actor.role) : "/dashboard");
}

export async function logoutAction() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  redirect("/login");
}

export async function resetDemoAction() {
  resetDb();
  revalidatePath("/");
  redirect(await dashboardForSession());
}

export async function createTaskAction(formData: FormData) {
  const result = await createTask({
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    assigneeId: String(formData.get("assigneeId") ?? ""),
    dueDate: String(formData.get("dueDate") ?? ""),
    priority: String(formData.get("priority") ?? "medium") as TaskPriority,
  });
  if (result.error) redirect("/dashboard/boss?error=" + encodeURIComponent(result.error));
  revalidatePath("/dashboard/boss");
  redirect("/dashboard/boss?created=1");
}

export async function updateTaskStatusAction(formData: FormData) {
  const taskId = String(formData.get("taskId") ?? "");
  const status = String(formData.get("status") ?? "") as TaskStatus;
  const result = await updateTaskStatus(taskId, status);
  if (result.error) redirect("/dashboard/employee?error=" + encodeURIComponent(result.error));
  revalidatePath("/dashboard/employee");
  revalidatePath("/dashboard/boss");
  revalidatePath("/dashboard/hr");
  redirect("/dashboard/employee");
}

export async function toggleBlockerAction(formData: FormData) {
  const taskId = String(formData.get("taskId") ?? "");
  const blocked = String(formData.get("blocked") ?? "") === "true";
  const result = await toggleTaskBlocker(taskId, blocked);
  if (result.error) redirect("/dashboard/employee?error=" + encodeURIComponent(result.error));
  revalidatePath("/dashboard/employee");
  revalidatePath("/dashboard/boss");
  revalidatePath("/dashboard/hr");
  redirect("/dashboard/employee");
}

export async function addCommentAction(formData: FormData) {
  const taskId = String(formData.get("taskId") ?? "");
  const body = String(formData.get("body") ?? "");
  const result = await addTaskComment(taskId, body);
  if (result.error) redirect("/dashboard/employee?error=" + encodeURIComponent(result.error));
  revalidatePath("/dashboard/employee");
  revalidatePath("/dashboard/boss");
  revalidatePath("/dashboard/hr");
  redirect("/dashboard/employee");
}

export async function createEmployeeAction(formData: FormData) {
  const result = await createEmployee({
    fullName: String(formData.get("fullName") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    title: String(formData.get("title") ?? ""),
    department: String(formData.get("department") ?? ""),
    jobRole: String(formData.get("jobRole") ?? ""),
  });
  if (result.error) redirect("/dashboard/hr/add?error=" + encodeURIComponent(result.error));
  revalidatePath("/dashboard/hr", "layout");
  redirect("/dashboard/hr/employees?created=1");
}

export async function updateEmployeeAction(formData: FormData) {
  const result = await updateEmployee({
    employeeId: String(formData.get("employeeId") ?? ""),
    fullName: String(formData.get("fullName") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    title: String(formData.get("title") ?? ""),
    department: String(formData.get("department") ?? ""),
    jobRole: String(formData.get("jobRole") ?? ""),
  });
  if (result.error) redirect("/dashboard/hr/employees?error=" + encodeURIComponent(result.error));
  revalidatePath("/dashboard/hr", "layout");
  redirect("/dashboard/hr/employees?updated=1");
}

export async function deleteEmployeeAction(formData: FormData) {
  const result = await deleteEmployee(String(formData.get("employeeId") ?? ""));
  if (result.error) redirect("/dashboard/hr/employees?error=" + encodeURIComponent(result.error));
  revalidatePath("/dashboard/hr", "layout");
  redirect("/dashboard/hr/employees?deleted=1");
}
