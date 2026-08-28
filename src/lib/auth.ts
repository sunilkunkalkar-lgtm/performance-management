import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "./db";
import { readSessionUserId, signSession, SESSION_COOKIE } from "./session";
import type { Role, User } from "@prisma/client";

export type SessionUser = Pick<
  User,
  "id" | "email" | "name" | "title" | "role" | "departmentId" | "managerId"
>;

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!user) return { error: "Invalid email or password." };
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return { error: "Invalid email or password." };
  const jar = await cookies();
  jar.set(SESSION_COOKIE, signSession(user.id), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 14,
  });
  return { user };
}

export async function logout() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const userId = readSessionUserId(jar.get(SESSION_COOKIE)?.value);
  if (!userId) return null;
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      title: true,
      role: true,
      departmentId: true,
      managerId: true,
    },
  });
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireRole(roles: Role[]) {
  const user = await requireUser();
  if (!roles.includes(user.role)) redirect("/dashboard");
  return user;
}

export const DEMO_ACCOUNTS = [
  { email: "priya@suii.app", name: "Priya Nair", role: "People / Admin" },
  { email: "marcus@suii.app", name: "Marcus Chen", role: "Engineering Manager" },
  { email: "maya@suii.app", name: "Maya Okonkwo", role: "Design Manager" },
  { email: "aisha@suii.app", name: "Aisha Rahman", role: "Senior Engineer" },
  { email: "samir@suii.app", name: "Samir Joshi", role: "Engineer" },
  { email: "leo@suii.app", name: "Leo Park", role: "Designer" },
  { email: "jordan@suii.app", name: "Jordan Hale", role: "Product Manager" },
] as const;
