export type AdminRole = "MEMBER" | "CAPTAIN" | "REFEREE" | "ADMIN" | "SUPERADMIN";

// Roles that may enter the admin panel at all.
export const ADMIN_ROLES: AdminRole[] = ["ADMIN", "SUPERADMIN"];

// Per-page access control — customize here to choose who can access which page.
// Rules are matched by path prefix; first match wins.
// Pages not listed here are accessible to anyone in ADMIN_ROLES.
export const PAGE_PERMISSIONS: Array<{ prefix: string; roles: AdminRole[] }> = [
  { prefix: "/admin/uitnodigingen",  roles: ["ADMIN", "SUPERADMIN"] },
  { prefix: "/admin/inschrijvingen", roles: ["ADMIN", "SUPERADMIN"] },
  { prefix: "/admin/messages",       roles: ["ADMIN", "SUPERADMIN"] },
  { prefix: "/admin/events",         roles: ["ADMIN", "SUPERADMIN"] },
  { prefix: "/admin/news",           roles: ["ADMIN", "SUPERADMIN"] },
  { prefix: "/admin/sponsors",       roles: ["ADMIN", "SUPERADMIN"] },
  { prefix: "/admin/members",        roles: ["ADMIN", "SUPERADMIN"] },
  { prefix: "/admin/toernooi",       roles: ["ADMIN", "SUPERADMIN"] },
];

export function isPageAllowed(role: string, pathname: string): boolean {
  const rule = PAGE_PERMISSIONS.find(
    (r) => pathname === r.prefix || pathname.startsWith(r.prefix + "/")
  );
  if (rule) return (rule.roles as string[]).includes(role);
  return (ADMIN_ROLES as string[]).includes(role);
}
