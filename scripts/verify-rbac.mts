import { resetDb, getDb } from "../src/lib/pms/context";
import { authenticate, executiveSummary } from "../src/lib/pms/queries";
import { tasksForActor, listEmployeesForActor } from "../src/lib/pms/rbac";
import { actorFromClerkId } from "../src/lib/pms/seed";

async function main() {
  resetDb();
  for (const [email, pw] of [
    ["boss@suii.app", "boss123"],
    ["hr@suii.app", "hr123"],
    ["aisha@suii.app", "employee123"],
    ["wrong@suii.app", "bad"],
  ]) {
    const r = await authenticate(email, pw);
    console.log(email, r.error ?? "OK");
  }
  const db = getDb();
  const boss = actorFromClerkId(db, "user_boss")!;
  const hr = actorFromClerkId(db, "user_hr")!;
  const aisha = actorFromClerkId(db, "user_aisha")!;
  const bossTasks = tasksForActor(boss, db);
  console.log("Boss summary", executiveSummary(bossTasks));
  console.log("Blockers", bossTasks.filter((t) => t.isBlocked).length);
  console.log("HR employees", listEmployeesForActor(hr, db).length);
  console.log("Aisha task count", tasksForActor(aisha, db).length);
  console.log("Aisha isolation", tasksForActor(aisha, db).every((t) => t.assigneeId === aisha.id));
}

main();
