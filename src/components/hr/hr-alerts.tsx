import { Alert } from "@/components/ui";

export function HrAlerts({
  error,
  created,
  updated,
  deleted,
}: {
  error?: string;
  created?: string;
  updated?: string;
  deleted?: string;
}) {
  return (
    <>
      {error ? <Alert>{error}</Alert> : null}
      {created ? <Alert tone="info">Employee added successfully.</Alert> : null}
      {updated ? <Alert tone="info">Employee updated successfully.</Alert> : null}
      {deleted ? <Alert tone="info">Employee removed successfully.</Alert> : null}
    </>
  );
}
