import { requireActorRole } from "@/lib/pms/context";

export default async function HrLayout({ children }: { children: React.ReactNode }) {
  await requireActorRole("hr");
  return <div className="space-y-6">{children}</div>;
}
