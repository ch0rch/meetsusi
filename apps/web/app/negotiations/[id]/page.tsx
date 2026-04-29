import { notFound, redirect } from "next/navigation";
import type { UIMessage } from "ai";
import { getServerSession } from "@/lib/session/get-server-session";
import {
  getNegotiationByIdForUser,
  listMessagesForNegotiation,
} from "@/lib/db/negotiations";
import type { Message } from "@/lib/db/schema";
import { NegotiationChat } from "./negotiation-chat";

interface Props {
  params: Promise<{ id: string }>;
}

function toUIMessage(msg: Message): UIMessage {
  return {
    id: msg.id,
    role: msg.role as "user" | "assistant",
    parts: (msg.parts as UIMessage["parts"]) ?? [
      { type: "text", text: msg.content },
    ],
  };
}

export default async function NegotiationPage({ params }: Props) {
  const session = await getServerSession();
  if (!session) redirect("/");

  const { id } = await params;
  const [negotiation, dbMessages] = await Promise.all([
    getNegotiationByIdForUser(id, session.user.id),
    listMessagesForNegotiation(id),
  ]);
  if (!negotiation) notFound();

  // DB returns newest first — reverse to chronological order
  const history: UIMessage[] = dbMessages.reverse().map(toUIMessage);

  return <NegotiationChat negotiation={negotiation} history={history} />;
}
