import { redirect } from "next/navigation";

export default function HrDashboardIndexPage() {
  redirect("/dashboard/hr/employees");
}
