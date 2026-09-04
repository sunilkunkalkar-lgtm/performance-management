import { createEmployeeAction } from "@/app/actions";
import { HrAlerts } from "@/components/hr/hr-alerts";
import { SubmitButton } from "@/components/submit-button";
import { Card, Field, PageHeader, inputClassName } from "@/components/ui";

export default async function HrAddEmployeePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; created?: string; updated?: string; deleted?: string }>;
}) {
  const params = await searchParams;

  return (
    <>
      <PageHeader
        kicker="HR"
        title="Add employees"
        description="Create a new employee account with login credentials."
      />
      <HrAlerts {...params} />

      <Card className="max-w-2xl">
        <form action={createEmployeeAction} className="grid gap-3">
          <Field label="Full name">
            <input name="fullName" required className={inputClassName} />
          </Field>
          <Field label="Email">
            <input type="email" name="email" required className={inputClassName} />
          </Field>
          <Field label="Password">
            <input type="password" name="password" required className={inputClassName} />
          </Field>
          <Field label="Title">
            <input name="title" className={inputClassName} />
          </Field>
          <Field label="Department">
            <input name="department" className={inputClassName} />
          </Field>
          <Field label="Job role">
            <input name="jobRole" className={inputClassName} />
          </Field>
          <SubmitButton>Add employee</SubmitButton>
        </form>
      </Card>
    </>
  );
}
