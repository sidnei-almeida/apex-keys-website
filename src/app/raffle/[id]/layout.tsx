/**
 * Fundo e texto base estilo "Premium Dark" só nesta rota (detalhe da rifa).
 */
export default function RaffleDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-premium-bg text-premium-text antialiased">
      {children}
    </div>
  );
}
