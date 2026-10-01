export default function TournamentLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Bewust géén SiteHeader: het toernooi is een eigen platform met een eigen
  // schil (zie tournament-header.tsx), niet een pagina binnen de vzw-site.
  return <div className="min-h-screen bg-paper">{children}</div>;
}
