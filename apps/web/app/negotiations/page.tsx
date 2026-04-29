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
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8 flex items-center justify-between">
            <h1 className="susi-display-section text-2xl text-black dark:text-white">
              Negotiations
            </h1>
            <Link
              href="/negotiations/new"
              className="rounded-[6px] bg-[#010120] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-85 dark:bg-white dark:text-[#010120]"
            >
              New
            </Link>
          </div>

          {negotiations.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-24 text-center">
              <p className="susi-display-section text-xl text-black dark:text-white">
                No negotiations yet
              </p>
              <p className="max-w-xs text-sm leading-relaxed text-black/50 dark:text-white/45">
                Start one and Susi will handle the back-and-forth for you.
              </p>
              <Link
                href="/negotiations/new"
                className="mt-2 rounded-[6px] bg-[#010120] px-5 py-2.5 text-sm font-medium text-white hover:opacity-85 dark:bg-white dark:text-[#010120]"
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
        </div>
      </div>
    </div>
  );
}
