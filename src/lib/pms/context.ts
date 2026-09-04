import fs from "node:fs";
import path from "node:path";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { actorFromClerkId, seedDb, type Db } from "./seed";
import type { Actor } from "./types";
import { SESSION_COOKIE, readSessionUserId } from "@/lib/session";
import { clerkEnabled, usesSupabase } from "./config";
import { getActorFromStore, linkClerkProfile } from "./repository";

export { authMode, clerkEnabled, supabaseEnabled, usesSupabase } from "./config";

const globalForDb = globalThis as unknown as { suiiDb?: Db };

function dataFile() {
  return path.join(process.cwd(), ".data", "pms-demo.json");
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

    const existing = await getActorFromStore(userId);
    if (existing) return existing;

    const { currentUser } = await import("@clerk/nextjs/server");
    const user = await currentUser();
    const email = user?.primaryEmailAddress?.emailAddress?.toLowerCase();
    if (!email) return null;

    if (usesSupabase()) {
      return linkClerkProfile({
        clerkId: userId,
        email,
        fullName:
          [user?.firstName, user?.lastName].filter(Boolean).join(" ") || email,
        avatarUrl: user?.imageUrl ?? null,
      });
    }

    const db = getDb();
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
  if (!actor) {
    if (clerkEnabled()) redirect("/access-denied");
    redirect("/login");
  }
  return actor;
}
