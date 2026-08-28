import fs from "node:fs";
import path from "node:path";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { actorFromClerkId, seedDb, type Db } from "./seed";
import type { Actor } from "./types";
import { SESSION_COOKIE, readSessionUserId } from "@/lib/session";

const globalForDb = globalThis as unknown as { suiiDb?: Db };

function dataFile() {
  return path.join(process.cwd(), ".data", "pms-demo.json");
}

export function authMode(): "demo" | "clerk" {
  return process.env.AUTH_MODE === "clerk" ? "clerk" : "demo";
}

export function clerkEnabled() {
  return (
    authMode() === "clerk" && Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)
  );
}

export function supabaseEnabled() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  );
}

export function persistDb() {
  const db = globalForDb.suiiDb;
  if (!db) return;
  const file = dataFile();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(db), "utf8");
}

export function getDb(): Db {
  if (!globalForDb.suiiDb) {
    try {
      const raw = fs.readFileSync(dataFile(), "utf8");
      globalForDb.suiiDb = JSON.parse(raw) as Db;
    } catch {
      globalForDb.suiiDb = seedDb();
      persistDb();
    }
  }
  return globalForDb.suiiDb;
}

export function resetDb() {
  globalForDb.suiiDb = seedDb();
  persistDb();
}

export async function getActor(): Promise<Actor | null> {
  if (clerkEnabled()) {
    const { auth } = await import("@clerk/nextjs/server");
    const { userId } = await auth();
    if (!userId) return null;
    const db = getDb();
    const existing = actorFromClerkId(db, userId);
    if (existing) return existing;
    const { currentUser } = await import("@clerk/nextjs/server");
    const user = await currentUser();
    const email = user?.primaryEmailAddress?.emailAddress?.toLowerCase();
    if (!email) return null;
    const byEmail = db.profiles.find((p) => p.email === email);
    if (byEmail) {
      byEmail.clerkId = userId;
      persistDb();
      return actorFromClerkId(db, userId);
    }
    return null;
  }

  const jar = await cookies();
  const clerkId = readSessionUserId(jar.get(SESSION_COOKIE)?.value);
  if (!clerkId) return null;
  return actorFromClerkId(getDb(), clerkId);
}

export async function requireActor() {
  const actor = await getActor();
  if (!actor) redirect("/login");
  return actor;
}
