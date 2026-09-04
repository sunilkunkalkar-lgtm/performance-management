import { redirect } from "next/navigation";
import { requireActor } from "@/lib/pms/context";
import { dashboardPathForRole } from "@/lib/pms/rbac";

export default async function DashboardRedirectPage() {
  const actor = await requireActor();
  redirect(dashboardPathForRole(actor.role));
}
