import { listPeople } from "@/lib/pms/queries";
import { Badge, Card, PageHeader } from "@/components/ui";
import { initials } from "@/lib/format";

export default async function PeoplePage() {
  const { people } = await listPeople();
  return (
    <div>
      <PageHeader
        kicker="Directory"
        title="People"
        description="Org directory used by kudos, cascading OKRs, and reporting lines."
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {people.map((person) => {
          const manager = people.find((p) => p.id === person.managerId);
          return (
            <Card key={person.id}>
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal text-sm text-paper">
                  {initials(person.fullName)}
                </div>
                <div>
                  <p className="font-medium">{person.fullName}</p>
                  <p className="text-sm text-ink-soft">{person.title}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge>{person.department}</Badge>
                <Badge tone="gold">{person.role}</Badge>
              </div>
              <p className="mt-3 text-sm text-ink-soft">
                {manager ? `Reports to ${manager.fullName}` : "Company lead"}
              </p>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
