import { sendKudoAction } from "@/app/actions";
import { Alert, Badge, Card, PageHeader } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { listKudos } from "@/lib/pms/queries";
import { formatDate } from "@/lib/format";

const BADGES = ["Impact", "Craft", "Growth", "Collaboration", "Ownership"];

export default async function KudosPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const { actor, kudos, people } = await listKudos();

  return (
    <div>
      <PageHeader
        kicker="360° recognition"
        title="Kudos board"
        description="Public shoutouts across departments. Everyone authenticated can read the feed."
      />
      {error ? <Alert>{error}</Alert> : null}
      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <h2 className="font-serif text-xl">Give kudos</h2>
          <form action={sendKudoAction} className="mt-4 space-y-3">
            <label className="block text-sm">
              Colleague
              <select
                name="toId"
                required
                className="mt-1.5 w-full rounded-xl border border-line bg-cream/40 px-3 py-2.5 outline-none ring-teal focus:ring-2"
              >
                <option value="">Select</option>
                {people
                  .filter((p) => p.id !== actor.id)
                  .map((person) => (
                    <option key={person.id} value={person.id}>
                      {person.fullName} · {person.department}
                    </option>
                  ))}
              </select>
            </label>
            <label className="block text-sm">
              Badge
              <select
                name="badge"
                className="mt-1.5 w-full rounded-xl border border-line bg-cream/40 px-3 py-2.5 outline-none ring-teal focus:ring-2"
              >
                {BADGES.map((badge) => (
                  <option key={badge}>{badge}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              Shoutout
              <textarea
                name="message"
                required
                rows={4}
                className="mt-1.5 w-full rounded-xl border border-line bg-cream/40 px-3 py-2.5 outline-none ring-teal focus:ring-2"
              />
            </label>
            <SubmitButton pendingLabel="Posting…">Post to the board</SubmitButton>
          </form>
        </Card>
        <div className="space-y-3 lg:col-span-3">
          {kudos.map((item) => {
            const from = people.find((p) => p.id === item.fromEmployeeId);
            const to = people.find((p) => p.id === item.toEmployeeId);
            return (
              <Card key={item.id}>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">
                    {from?.fullName} → {to?.fullName}
                  </p>
                  <Badge tone="gold">{item.badge}</Badge>
                </div>
                <p className="mt-2 text-sm leading-relaxed">{item.message}</p>
                <p className="mt-2 text-xs text-ink-soft">
                  {to?.department} · {formatDate(item.createdAt)}
                </p>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
