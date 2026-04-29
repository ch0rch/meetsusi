import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getServerSession } from "@/lib/session/get-server-session";
import { listNegotiationsForUser } from "@/lib/db/negotiations";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";

export default async function NegotiationsLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getServerSession();
  if (!session) redirect("/");

  const negotiations = await listNegotiationsForUser(session.user.id);

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <DashboardSidebar
        negotiations={negotiations.slice(0, 8)}
        userEmail={session.user.email ?? ""}
      />
      <main className="flex flex-1 flex-col overflow-hidden">{children}</main>
    </div>
  );
}
