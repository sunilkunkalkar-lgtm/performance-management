import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Badge, Card, PageHeader } from "@/components/ui";
import { initials, roleLabel } from "@/lib/format";

export default async function PeoplePage() {
  await requireUser();
  const people = await prisma.user.findMany({
    include: { department: true, manager: true },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <PageHeader
        kicker="Directory"
        title="People"
        description="Everyone in the Suii demo workspace, with reporting lines."
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {people.map((person) => (
          <Card key={person.id}>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal text-sm text-paper">
                {initials(person.name)}
              </div>
              <div>
                <p className="font-medium">{person.name}</p>
                <p className="text-sm text-ink-soft">{person.title}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge>{person.department.name}</Badge>
              <Badge tone="gold">{roleLabel(person.role)}</Badge>
            </div>
            <p className="mt-3 text-sm text-ink-soft">
              {person.manager ? `Reports to ${person.manager.name}` : "Company lead"}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
