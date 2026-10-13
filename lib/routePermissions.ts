export type AdminRole = "MEMBER" | "CAPTAIN" | "REFEREE" | "ADMIN" | "SUPERADMIN";

// Roles that may enter the admin panel at all.
// Scheidsrechters komen binnen, maar enkel in de eventdag-modus (zie REFEREE_PAGES).
export const ADMIN_ROLES: AdminRole[] = ["ADMIN", "SUPERADMIN", "REFEREE"];

/** Volledige beheerders: alles behalve wat PAGE_PERMISSIONS anders zegt. */
const FULL_ADMIN_ROLES: AdminRole[] = ["ADMIN", "SUPERADMIN"];

/**
 * Wat een scheidsrechter mag openen: de eventdag-modus (aanmelden, scores,
 * banen) en de doorverwijzing ernaartoe. De backend laat hem daar enkel
 * inchecken en scores ingeven (manageTournamentOperations).
 */
const REFEREE_PAGES: RegExp[] = [
  /^\/admin\/eventdag\/?$/,
  /^\/admin\/toernooi\/\d+\/eventdag\/?$/,
];

// Per-page access control — customize here to choose who can access which page.
// Rules are matched by path prefix; first match wins.
// Pages not listed here are accessible to FULL_ADMIN_ROLES.
export const PAGE_PERMISSIONS: Array<{ prefix: string; roles: AdminRole[] }> = [
  { prefix: "/admin/uitnodigingen",  roles: ["ADMIN", "SUPERADMIN"] },
  { prefix: "/admin/inschrijvingen", roles: ["ADMIN", "SUPERADMIN"] },
  { prefix: "/admin/helpers",        roles: ["ADMIN", "SUPERADMIN"] },
  { prefix: "/admin/messages",       roles: ["ADMIN", "SUPERADMIN"] },
  { prefix: "/admin/events",         roles: ["ADMIN", "SUPERADMIN"] },
  { prefix: "/admin/news",           roles: ["ADMIN", "SUPERADMIN"] },
  { prefix: "/admin/sponsors",       roles: ["ADMIN", "SUPERADMIN"] },
  { prefix: "/admin/members",        roles: ["ADMIN", "SUPERADMIN"] },
  { prefix: "/admin/toernooi",       roles: ["ADMIN", "SUPERADMIN"] },
  { prefix: "/admin/draaiboek",      roles: ["ADMIN", "SUPERADMIN"] },
];

export function isPageAllowed(role: string, pathname: string): boolean {
  if (role === "REFEREE") return REFEREE_PAGES.some((re) => re.test(pathname));
  const rule = PAGE_PERMISSIONS.find(
    (r) => pathname === r.prefix || pathname.startsWith(r.prefix + "/")
  );
  if (rule) return (rule.roles as string[]).includes(role);
  return (FULL_ADMIN_ROLES as string[]).includes(role);
}

/** Startpagina na het inloggen of bij een pagina waar je niet mag komen. */
export function homeForRole(role: string): string {
  return role === "REFEREE" ? "/admin/eventdag" : "/admin";
}
