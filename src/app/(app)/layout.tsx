import { requireActor } from "@/lib/pms/context";
import { AppShell } from "@/components/ui";

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireActor();
  return <AppShell user={user}>{children}</AppShell>;
}
