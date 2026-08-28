import { sendFeedbackAction } from "@/app/actions";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, PageHeader } from "@/components/ui";
import { formatDate } from "@/lib/format";

export default async function FeedbackPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireUser();
  const { error } = await searchParams;
  const [people, received, given] = await Promise.all([
    prisma.user.findMany({
      where: { id: { not: user.id } },
      orderBy: { name: "asc" },
    }),
    prisma.feedback.findMany({
      where: { toId: user.id },
      include: { from: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.feedback.findMany({
      where: { fromId: user.id },
      include: { to: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div>
      <PageHeader
        kicker="Continuous"
        title="Feedback"
        description="Share specific, timely notes. Feedback is visible to the recipient."
      />
      {error ? (
        <p className="mb-4 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <h2 className="font-serif text-xl">Give feedback</h2>
          <form action={sendFeedbackAction} className="mt-4 space-y-3">
            <label className="block text-sm">
              Colleague
              <select
                name="toId"
                required
                className="mt-1.5 w-full rounded-xl border border-line bg-cream/40 px-3 py-2.5 outline-none ring-teal focus:ring-2"
              >
                <option value="">Select</option>
                {people.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.name} · {person.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              Note
              <textarea
                name="message"
                required
                rows={5}
                placeholder="What did they do, and why did it matter?"
                className="mt-1.5 w-full rounded-xl border border-line bg-cream/40 px-3 py-2.5 outline-none ring-teal focus:ring-2"
              />
            </label>
            <button
              type="submit"
              className="rounded-xl bg-teal px-4 py-2.5 text-sm font-medium text-paper hover:bg-teal-deep"
            >
              Send
            </button>
          </form>
        </Card>

        <div className="space-y-6 lg:col-span-3">
          <Card>
            <h2 className="font-serif text-xl">Received</h2>
            <ul className="mt-4 space-y-4">
              {received.map((item) => (
                <li key={item.id} className="border-t border-line pt-4 first:border-0 first:pt-0">
                  <p className="text-sm leading-relaxed">{item.message}</p>
                  <p className="mt-1 text-xs text-ink-soft">
                    {item.from.name} · {formatDate(item.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          </Card>
          <Card>
            <h2 className="font-serif text-xl">Given</h2>
            <ul className="mt-4 space-y-4">
              {given.map((item) => (
                <li key={item.id} className="border-t border-line pt-4 first:border-0 first:pt-0">
                  <p className="text-sm leading-relaxed">{item.message}</p>
                  <p className="mt-1 text-xs text-ink-soft">
                    To {item.to.name} · {formatDate(item.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
