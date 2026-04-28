import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "@/lib/session/get-server-session";
import { listNegotiationsForUser } from "@/lib/db/negotiations";
import { NegotiationCard } from "./negotiation-card";

export const metadata = { title: "My Negotiations" };

export default async function NegotiationsPage() {
  const session = await getServerSession();
  if (!session) redirect("/");

  const negotiations = await listNegotiationsForUser(session.user.id);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <span className="text-lg font-semibold">Meet Susi</span>
          <Link
            href="/negotiations/new"
            className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-80"
          >
            New negotiation
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        {negotiations.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <p className="text-2xl font-semibold">No negotiations yet</p>
            <p className="text-muted-foreground">
              Start one and Susi will handle the back-and-forth.
            </p>
            <Link
              href="/negotiations/new"
              className="rounded-md bg-foreground px-5 py-2.5 text-sm font-medium text-background hover:opacity-80"
            >
              Start negotiating
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {negotiations.map((n) => (
              <li key={n.id}>
                <NegotiationCard negotiation={n} />
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
