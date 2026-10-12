import type { LucideIcon } from "lucide-react";
import {
  Bike,
  CalendarDays,
  ClipboardList,
  FileText,
  House,
  IdCard,
  Mail,
  Newspaper,
  Star,
  Trophy,
  Users,
  Zap,
} from "lucide-react";

/** Sleutel van een teller die de layout ophaalt (zie useAdminCounts). */
export type CountKey = "pendingRegistrations" | "unreadMessages";

export type NavItem = {
  href: string;
  label: string;
  Icon: LucideIcon;
  /** Alleen actief bij exact dit pad (voor /admin). */
  exact?: boolean;
  /** Extra paden die dit item ook actief maken (bv. Leden & toegang). */
  alsoActiveOn?: string[];
  count?: CountKey;
  /** Toon een live-bolletje (lopend toernooi). */
  live?: boolean;
  comingSoon?: boolean;
  inDevelopment?: boolean;
};

export type NavSection = { title: string | null; items: NavItem[] };

export const NAV_SECTIONS: NavSection[] = [
  {
    title: null,
    items: [
      { href: "/admin", label: "Vandaag", Icon: House, exact: true },
      { href: "/admin/eventdag", label: "Eventdag", Icon: Zap, alsoActiveOn: [] },
    ],
  },
  {
    title: "Evenementen",
    items: [
      { href: "/admin/toernooi", label: "Petanquetoernooi", Icon: Trophy },
      { href: "/admin/inschrijvingen", label: "Dorpelingenkoers", Icon: Bike, count: "pendingRegistrations" },
      { href: "/admin/events", label: "Events", Icon: CalendarDays, inDevelopment: true },
      { href: "/admin/helpers", label: "Helpers & shiften", Icon: Users },
    ],
  },
  {
    title: "Website",
    items: [
      { href: "/admin/news", label: "Nieuws", Icon: Newspaper },
      { href: "/admin/sponsors", label: "Sponsors", Icon: Star },
      { href: "/admin/page-editor", label: "Pagina's", Icon: FileText, comingSoon: true },
      { href: "/admin/form-editor", label: "Formulieren", Icon: ClipboardList, comingSoon: true },
    ],
  },
  {
    title: "Club",
    items: [
      { href: "/admin/members", label: "Leden & toegang", Icon: IdCard, alsoActiveOn: ["/admin/uitnodigingen"] },
      { href: "/admin/messages", label: "Berichten", Icon: Mail, count: "unreadMessages" },
    ],
  },
];

export function isNavItemActive(item: NavItem, pathname: string): boolean {
  if (item.exact) return pathname === item.href;
  // De eventdag-modus leeft onder /admin/toernooi/[id]/eventdag.
  if (item.href === "/admin/eventdag") return /^\/admin(\/toernooi\/\d+)?\/eventdag/.test(pathname);
  if (item.href === "/admin/toernooi" && /\/eventdag/.test(pathname)) return false;
  const paths = [item.href, ...(item.alsoActiveOn ?? [])];
  return paths.some((p) => pathname === p || pathname.startsWith(p + "/"));
}
