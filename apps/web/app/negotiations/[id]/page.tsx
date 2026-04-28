import { notFound, redirect } from "next/navigation";
import { getServerSession } from "@/lib/session/get-server-session";
import { getNegotiationByIdForUser } from "@/lib/db/negotiations";
import { NegotiationChat } from "./negotiation-chat";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function NegotiationPage({ params }: Props) {
  const session = await getServerSession();
  if (!session) redirect("/");

  const { id } = await params;
  const negotiation = await getNegotiationByIdForUser(id, session.user.id);
  if (!negotiation) notFound();

  return <NegotiationChat negotiation={negotiation} />;
}
