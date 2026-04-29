import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getServerSession } from "@/lib/session/get-server-session";
import { listNegotiationsForUser } from "@/lib/db/negotiations";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { MobileTopBar } from "@/components/dashboard/mobile-top-bar";

export default async function NegotiationsLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getServerSession();
  if (!session) redirect("/");

  const negotiations = await listNegotiationsForUser(session.user.id);

  const recentNegotiations = negotiations.slice(0, 8);
  const userEmail = session.user.email ?? "";

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <DashboardSidebar
        negotiations={recentNegotiations}
        userEmail={userEmail}
      />
      <main className="flex flex-1 flex-col overflow-hidden">
        <MobileTopBar negotiations={recentNegotiations} userEmail={userEmail} />
        {children}
      </main>
    </div>
  );
}
