export default function TournamentLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <div className="min-h-screen bg-paper">{children}</div>;
}
