import type { Metadata } from "next";
import { LiveSorteioClient } from "./LiveSorteioClient";

export const metadata: Metadata = {
  title: "Sorteio ao vivo | Apex Keys",
  description: "Acompanhe o countdown e a roleta do sorteio em direto.",
};

export default async function SorteioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <LiveSorteioClient raffleId={id} />;
}
