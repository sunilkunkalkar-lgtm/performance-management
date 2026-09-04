import { deleteEmployeeAction, updateEmployeeAction } from "@/app/actions";
import { HrAlerts } from "@/components/hr/hr-alerts";
import { SubmitButton } from "@/components/submit-button";
import { Card, Field, PageHeader, inputClassName } from "@/components/ui";
import { getDb } from "@/lib/pms/context";
import { hrDashboard } from "@/lib/pms/queries";

export default async function HrEmployeesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; created?: string; updated?: string; deleted?: string }>;
}) {
  const params = await searchParams;
  const data = await hrDashboard();
  if (!data.allowed) return null;

  return (
    <>
      <PageHeader
        kicker="HR"
        title="Employee management"
        description="View, update, and remove employee profiles and credentials."
      />
      <HrAlerts {...params} />

      <div className="space-y-4">
        {data.employees.map((employee) => {
          const profile = getDb().profiles.find((p) => p.id === employee.profileId)!;
          return (
            <Card key={employee.id}>
              <form action={updateEmployeeAction} className="grid gap-3 md:grid-cols-2">
                <input type="hidden" name="employeeId" value={employee.id} />
                <Field label="Full name">
                  <input name="fullName" defaultValue={profile.fullName} className={inputClassName} />
                </Field>
                <Field label="Email">
                  <input name="email" type="email" defaultValue={profile.email} className={inputClassName} />
                </Field>
                <Field label="New password (optional)">
                  <input
                    name="password"
                    type="password"
                    className={inputClassName}
                    placeholder="Leave blank to keep current"
                  />
                </Field>
                <Field label="Title">
                  <input name="title" defaultValue={employee.title} className={inputClassName} />
                </Field>
                <Field label="Department">
                  <input name="department" defaultValue={employee.department} className={inputClassName} />
                </Field>
                <Field label="Job role">
                  <input name="jobRole" defaultValue={employee.jobRole} className={inputClassName} />
                </Field>
                <div className="flex flex-wrap gap-2 md:col-span-2">
                  <SubmitButton>Save changes</SubmitButton>
                </div>
              </form>
              <form action={deleteEmployeeAction} className="mt-3 border-t border-line pt-3">
                <input type="hidden" name="employeeId" value={employee.id} />
                <SubmitButton className="rounded-xl border border-rose-200 px-4 py-2 text-sm text-rose-800 hover:bg-rose-50">
                  Remove employee
                </SubmitButton>
              </form>
            </Card>
          );
        })}
      </div>
    </>
  );
}
