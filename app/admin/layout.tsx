"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Check, House, LogOut, Mail, Menu, Monitor, Moon, Sun, Trophy, X } from "lucide-react";
import AuthService from "@/services/AuthService";
import { DrawerProvider } from "@/components/admin/drawer-provider";
import { getTokenPayload } from "@/lib/api";
import { isPageAllowed } from "@/lib/routePermissions";
import { NAV_SECTIONS, isNavItemActive, type NavItem, type NavSection } from "@/components/admin/nav-config";
import { useAdminCounts } from "@/hooks/use-admin-counts";
import { useTheme, type Theme } from "@/hooks/use-theme";
import "./admin.css";

const ROLE_LABELS: Record<string, string> = {
  SUPERADMIN: "Superadmin",
  ADMIN: "Admin",
};

// ── Thema ─────────────────────────────────────────────────────────────────────

const THEME_OPTIONS: { key: Theme; label: string; Icon: typeof Sun }[] = [
  { key: "light", label: "Licht", Icon: Sun },
  { key: "dark", label: "Donker", Icon: Moon },
  { key: "system", label: "Systeem", Icon: Monitor },
];

function ThemeMenu({ placement = "up" }: Readonly<{ placement?: "up" | "down" }>) {
  const { theme, apply } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const Active = THEME_OPTIONS.find((o) => o.key === theme)?.Icon ?? Monitor;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Thema wijzigen"
        aria-expanded={open}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-rule text-ink-2 transition-colors hover:bg-ink/5 hover:text-ink"
      >
        <Active size={16} strokeWidth={1.75} />
      </button>
      {open && (
        <div
          className={`animate-dropdown absolute right-0 z-50 w-40 overflow-hidden rounded-xl border border-rule bg-surface p-1 shadow-lg shadow-black/10 ${
            placement === "up" ? "bottom-full mb-2" : "top-full mt-2"
          }`}
        >
          {THEME_OPTIONS.map(({ key, label, Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => { apply(key); setOpen(false); }}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-ink/5 ${
                theme === key ? "font-semibold text-ink" : "text-ink-2"
              }`}
            >
              <Icon size={15} strokeWidth={1.75} />
              <span className="flex-1 text-left">{label}</span>
              {theme === key && <Check size={14} strokeWidth={2} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Navigatie ─────────────────────────────────────────────────────────────────

function NavLink({
  item,
  pathname,
  count,
  onNavigate,
}: Readonly<{ item: NavItem; pathname: string; count: number; onNavigate?: () => void }>) {
  const active = isNavItemActive(item, pathname);
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={`flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-sm transition-colors duration-150 ${
        active ? "bg-pink-soft font-semibold text-pink-ink" : "text-ink-2 hover:bg-ink/5 hover:text-ink"
      }`}
    >
      <item.Icon size={17} strokeWidth={1.75} className="shrink-0" aria-hidden />
      <span className="truncate">{item.label}</span>
      {count > 0 && (
        <span
          className={`ml-auto font-mono text-xs tabular-nums ${active ? "text-pink-ink" : "text-ink-2"}`}
          aria-label={`${count} open`}
        >
          {count}
        </span>
      )}
      {item.comingSoon && (
        <span className="ml-auto rounded-full border border-rule px-2 py-px text-[10px] font-semibold text-ink-2">
          Binnenkort
        </span>
      )}
      {item.inDevelopment && (
        <span className="ml-auto rounded-full border border-rule px-2 py-px text-[10px] font-semibold text-ink-2">
          In opbouw
        </span>
      )}
    </Link>
  );
}

function NavSections({
  sections,
  pathname,
  counts,
  onNavigate,
}: Readonly<{
  sections: NavSection[];
  pathname: string;
  counts: Record<string, number>;
  onNavigate?: () => void;
}>) {
  return (
    <nav className="flex flex-col gap-5" aria-label="Beheer">
      {sections.map((section) => (
        <div key={section.title ?? "top"}>
          {section.title && (
            <p className="mb-1.5 px-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-2/80">
              {section.title}
            </p>
          )}
          <div className="flex flex-col gap-0.5">
            {section.items.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                pathname={pathname}
                count={item.count ? counts[item.count] ?? 0 : 0}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}

function Brand() {
  return (
    <Link href="/admin" className="flex items-center gap-2.5 px-1.5">
      <Image src="/logo.jpg" alt="" width={32} height={32} className="rounded-[9px]" />
      <span className="flex flex-col leading-tight">
        <span className="text-[15px] font-bold tracking-tight text-ink">De Flosj</span>
        <span className="text-xs text-ink-2">Beheer</span>
      </span>
    </Link>
  );
}

function UserFooter({ username, role, onLogout }: Readonly<{ username: string; role: string; onLogout: () => void }>) {
  return (
    <div className="flex items-center gap-2.5 border-t border-rule pt-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-pink-soft text-[13px] font-semibold text-pink-ink">
        {(username[0] ?? "?").toUpperCase()}
      </div>
      <div className="min-w-0 flex-1 leading-tight">
        <p className="truncate text-[13px] font-semibold text-ink">{username || "—"}</p>
        <p className="text-xs text-ink-2">{ROLE_LABELS[role] ?? role}</p>
      </div>
      <ThemeMenu />
      <button
        type="button"
        onClick={onLogout}
        aria-label="Afmelden"
        title="Afmelden"
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-rule text-ink-2 transition-colors hover:bg-ink/5 hover:text-ink"
      >
        <LogOut size={16} strokeWidth={1.75} />
      </button>
    </div>
  );
}

// ── Mobiele tabbalk ───────────────────────────────────────────────────────────

const TABS = [
  { href: "/admin", label: "Vandaag", Icon: House, exact: true },
  { href: "/admin/toernooi", label: "Toernooi", Icon: Trophy },
  { href: "/admin/messages", label: "Inbox", Icon: Mail, count: "unreadMessages" as const },
];

// ── Layout ────────────────────────────────────────────────────────────────────

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const router = useRouter();
  const pathname = usePathname();
  const [role, setRole] = useState("");
  const [username, setUsername] = useState("");
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    const payload = getTokenPayload();
    setRole(payload?.role ?? "");
    setUsername(payload?.username ?? "");
  }, []);

  useEffect(() => setMoreOpen(false), [pathname]);

  const counts = useAdminCounts(role !== "");

  const sections = NAV_SECTIONS.map((s) => ({
    ...s,
    items: role ? s.items.filter((i) => isPageAllowed(role, i.href)) : s.items,
  })).filter((s) => s.items.length > 0);

  const tabs = TABS.filter((t) => !role || isPageAllowed(role, t.href));
  const tabActive = tabs.some((t) => (t.exact ? pathname === t.href : pathname.startsWith(t.href)));

  function handleLogout() {
    AuthService.logout();
    router.push("/login");
  }

  return (
    <div className="admin-shell flex min-h-screen bg-paper text-ink">
      {/* ── Sidebar (desktop) ─────────────────────────────── */}
      <aside
        className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-6 overflow-y-auto border-r border-rule bg-surface px-3.5 py-5 lg:flex"
        aria-label="Beheerpaneel navigatie"
      >
        <Brand />
        <div className="flex-1">
          <NavSections sections={sections} pathname={pathname} counts={counts} />
        </div>
        <UserFooter username={username} role={role} onLogout={handleLogout} />
      </aside>

      {/* ── Bovenbalk (mobiel) ────────────────────────────── */}
      <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between border-b border-rule bg-surface/95 px-4 backdrop-blur lg:hidden">
        <Brand />
        <ThemeMenu placement="down" />
      </header>

      {/* ── Inhoud ────────────────────────────────────────── */}
      <DrawerProvider>
        <main className="admin-content min-w-0 flex-1">{children}</main>
      </DrawerProvider>

      {/* ── Tabbalk (mobiel) ──────────────────────────────── */}
      <nav
        className="fixed inset-x-0 bottom-0 z-30 flex border-t border-rule bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden"
        aria-label="Hoofdmenu"
      >
        {tabs.map((t) => {
          const active = t.exact ? pathname === t.href : pathname.startsWith(t.href);
          const n = t.count ? counts[t.count] : 0;
          return (
            <Link
              key={t.href}
              href={t.href}
              aria-current={active ? "page" : undefined}
              className={`relative flex h-16 flex-1 flex-col items-center justify-center gap-1 text-[11px] ${
                active ? "font-semibold text-ink" : "font-medium text-ink-2"
              }`}
            >
              <t.Icon size={22} strokeWidth={active ? 2 : 1.75} aria-hidden />
              {t.label}
              {n > 0 && (
                <span className="absolute left-[calc(50%+6px)] top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-pink px-1 text-[10px] font-bold text-[#16161a]">
                  {n}
                </span>
              )}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          aria-expanded={moreOpen}
          className={`flex h-16 flex-1 flex-col items-center justify-center gap-1 text-[11px] ${
            !tabActive ? "font-semibold text-ink" : "font-medium text-ink-2"
          }`}
        >
          <Menu size={22} strokeWidth={!tabActive ? 2 : 1.75} aria-hidden />
          Meer
        </button>
      </nav>

      {/* ── Meer-sheet (mobiel) ───────────────────────────── */}
      {moreOpen && (
        <dialog open className="fixed inset-0 z-40 m-0 h-full w-full max-w-none border-none bg-transparent p-0 lg:hidden" aria-label="Menu">
          <button type="button" onClick={() => setMoreOpen(false)} className="t-scrim absolute inset-0 bg-black/40" aria-label="Sluit menu" />
          <div className="t-sheet absolute inset-x-0 bottom-0 flex max-h-[85vh] flex-col gap-5 overflow-y-auto rounded-t-2xl bg-surface px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4">
            <div className="flex items-center justify-between">
              <p className="text-base font-semibold">Menu</p>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                aria-label="Sluit menu"
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-rule text-ink-2"
              >
                <X size={18} />
              </button>
            </div>
            <NavSections sections={sections} pathname={pathname} counts={counts} onNavigate={() => setMoreOpen(false)} />
            <UserFooter username={username} role={role} onLogout={handleLogout} />
          </div>
        </dialog>
      )}
    </div>
  );
}
