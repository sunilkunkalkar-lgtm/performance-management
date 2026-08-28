import { heatmap } from "@/lib/pms/queries";
import { Card, PageHeader } from "@/components/ui";

function cellClass(level: number | undefined, expected: number | undefined) {
  if (level == null) return "bg-cream text-ink-soft";
  if (expected == null) return "bg-teal/10 text-teal-deep";
  if (level >= expected) return "bg-teal text-paper";
  if (level === expected - 1) return "bg-gold/40 text-ink";
  return "bg-rose-100 text-rose-900";
}

export default async function SkillsPage() {
  const { actor, people, skills, benchmarks, employeeSkills } = await heatmap();
  const relevantSkills = skills.filter((skill) =>
    people.some((person) =>
      benchmarks.some((b) => b.jobRole === person.jobRole && b.skillId === skill.id),
    ),
  );

  return (
    <div>
      <PageHeader
        kicker="Competency"
        title="Skills heatmap"
        description="Each cell is current level versus the benchmark for that job role. Employees see themselves; managers see their team."
      />
      <Card className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-1 text-sm">
          <thead>
            <tr>
              <th className="px-2 py-1 text-left font-medium text-ink-soft">Person</th>
              {relevantSkills.map((skill) => (
                <th key={skill.id} className="px-2 py-1 text-center font-medium text-ink-soft">
                  {skill.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {people.map((person) => (
              <tr key={person.id}>
                <td className="whitespace-nowrap px-2 py-1">
                  <p className="font-medium">
                    {person.fullName}
                    {person.id === actor.id ? " (you)" : ""}
                  </p>
                  <p className="text-xs text-ink-soft">{person.jobRole}</p>
                </td>
                {relevantSkills.map((skill) => {
                  const expected = benchmarks.find(
                    (b) => b.jobRole === person.jobRole && b.skillId === skill.id,
                  )?.expectedLevel;
                  const level = employeeSkills.find(
                    (s) => s.employeeId === person.id && s.skillId === skill.id,
                  )?.level;
                  return (
                    <td key={skill.id} className="px-1 py-1 text-center">
                      <div
                        className={`rounded-lg px-2 py-2 text-xs font-medium ${cellClass(level, expected)}`}
                        title={
                          expected
                            ? `Level ${level ?? "—"} / benchmark ${expected}`
                            : "No benchmark"
                        }
                      >
                        {expected ? `${level ?? "—"}/${expected}` : level ?? "—"}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-4 text-xs text-ink-soft">
          Teal meets or exceeds the role benchmark. Gold is one level below. Rose is a wider gap.
        </p>
      </Card>
    </div>
  );
}
