"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import AuthService from "@/services/AuthService";
import { DrawerProvider } from "@/components/admin/drawer-provider";
import { getTokenPayload } from "@/lib/api";
import { isPageAllowed } from "@/lib/routePermissions";
import "./admin.css";
import { Button } from "@/components/ui/button";
import {
  IconGrid,
  IconTrophy,
  IconDocument,
  IconCalendar,
  IconStar,
  IconUsers,
  IconMail,
  IconLogout,
  IconClipboard,
  IconKey,
  IconHamburger,
  IconClose,
  IconEdit,
  IconSun,
  IconMoon,
  IconMonitor,
  IconCheck,
} from "@/components/ui/icons";
import { useTheme, type Theme } from "@/hooks/use-theme";

const THEME_OPTIONS: { key: Theme; label: string; Icon: () => React.ReactElement }[] = [
  { key: "light",  label: "Licht",   Icon: IconSun     },
  { key: "dark",   label: "Donker",  Icon: IconMoon    },
  { key: "system", label: "Systeem", Icon: IconMonitor },
];

function AdminThemeDropdown() {
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

  let ActiveIcon = IconMonitor;
  if (theme === "dark") ActiveIcon = IconMoon;
  else if (theme === "light") ActiveIcon = IconSun;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Thema wijzigen"
        aria-expanded={open}
        className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors duration-150 ${
          open ? "bg-white/12 text-white" : "text-white/50 hover:bg-white/8 hover:text-white/80"
        }`}
      >
        <ActiveIcon />
      </button>

      {open && (
        <div className="animate-dropdown absolute right-0 top-full z-50 mt-2 w-40 overflow-hidden rounded-xl border border-white/10 bg-[#1f1f25] shadow-lg shadow-black/30">
          {THEME_OPTIONS.map(({ key, label, Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => { apply(key); setOpen(false); }}
              className={`flex w-full items-center gap-3 px-3.5 py-2.5 text-sm transition-colors duration-100 hover:bg-white/6 ${
                theme === key ? "text-pink" : "text-white/55 hover:text-white/85"
              }`}
            >
              <Icon />
              <span className="flex-1 text-left">{label}</span>
              {theme === key && <IconCheck />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

type NavItem = {
  href: string;
  label: string;
  exact: boolean;
  Icon: () => React.ReactElement;
  comingSoon?: boolean;
  inDevelopment?: boolean;
};

const navSections: Array<{ title: string; items: NavItem[] }> = [
  {
    title: "Overzicht",
    items: [
      { href: "/admin", label: "Dashboard", exact: true, Icon: IconGrid },
    ],
  },
  {
    title: "Beheer",
    items: [
      { href: "/admin/toernooi", label: "Toernooi", exact: false, Icon: IconTrophy },
      { href: "/admin/inschrijvingen", label: "Inschrijvingen", exact: false, Icon: IconClipboard },
      { href: "/admin/helpers", label: "Helpers", exact: false, Icon: IconUsers },
      { href: "/admin/uitnodigingen", label: "Uitnodigingen", exact: false, Icon: IconKey },
      { href: "/admin/members", label: "Leden", exact: false, Icon: IconUsers },
      { href: "/admin/messages", label: "Berichten", exact: false, Icon: IconMail },
    ],
  },
  {
    title: "Content",
    items: [
      { href: "/admin/news", label: "Nieuws", exact: false, Icon: IconDocument },
      { href: "/admin/events", label: "Events", exact: false, Icon: IconCalendar, inDevelopment: true },
      { href: "/admin/sponsors", label: "Sponsors", exact: false, Icon: IconStar },
      { href: "/admin/page-editor", label: "Page editor", exact: false, Icon: IconEdit, comingSoon: true },
      { href: "/admin/form-editor", label: "Form editor", exact: false, Icon: IconClipboard, comingSoon: true },
    ],
  },
];

// ── Layout ────────────────────────────────────────────────────────────────────

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const router = useRouter();
  const pathname = usePathname();
  const [role, setRole] = useState("");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  useEffect(() => {
    setRole(getTokenPayload()?.role ?? "");
  }, []);

  const visibleSections = navSections
    .map((section) => ({
      ...section,
      items: role
        ? section.items.filter((item) => isPageAllowed(role, item.href))
        : section.items,
    }))
    .filter((section) => section.items.length > 0);

  function handleLogout() {
    AuthService.logout();
    router.push("/login");
  }

  return (
    <div className="flex min-h-screen bg-surface">

      {/* ── Mobile top bar ─────────────────────────────────── */}
      <div className="fixed inset-x-0 top-0 z-30 flex items-center justify-between border-b border-white/10 bg-[#16161a] px-4 py-3 lg:hidden">
        <p className="text-sm font-semibold text-white/90">De Flosj Beheer</p>
        <div className="flex items-center gap-1">
          <AdminThemeDropdown />
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 text-white/80 transition-colors hover:text-white"
            aria-label="Open admin menu"
          >
            <IconHamburger />
          </button>
        </div>
      </div>

      {/* ── Mobile sidebar ─────────────────────────────────── */}
      {mobileNavOpen && (
        <dialog open className="fixed inset-0 z-40 m-0 h-full w-full max-w-none border-none bg-transparent p-0 lg:hidden" aria-label="Admin menu">
          <button
            type="button"
            onClick={() => setMobileNavOpen(false)}
            className="absolute inset-0 bg-black/55"
            aria-label="Sluit admin menu"
          />
          <aside className="relative h-full w-72 max-w-[85vw] overflow-y-auto bg-[#16161a]">
            <div className="flex items-center justify-between border-b border-white/8 px-4 py-4">
              <p className="text-sm font-semibold text-white/90">Menu</p>
              <button
                type="button"
                onClick={() => setMobileNavOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-white/15 text-white/70"
                aria-label="Sluit menu"
              >
                <IconClose />
              </button>
            </div>

            <nav className="flex flex-col gap-5 px-3 py-4">
              {visibleSections.map((section) => (
                <div key={section.title} className="space-y-2">
                  <p className="px-2.5 font-mono text-[0.55rem] font-semibold uppercase tracking-widest text-white/30">
                    {section.title}
                  </p>
                  <div className="space-y-1">
                    {section.items.map((item) => {
                      const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileNavOpen(false)}
                          className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-150 ${
                            active
                              ? "bg-pink/10 text-pink"
                              : "text-white/55 hover:bg-white/6 hover:text-white/85"
                          }`}
                        >
                          <item.Icon />
                          <span>{item.label}</span>
                          {item.comingSoon && (
                            <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide text-white/65">
                              Soon
                            </span>
                          )}
                          {item.inDevelopment && (
                            <span className="ml-auto rounded-full bg-yellow-500/10 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide text-yellow-500/65">
                              WIP
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            <div className="border-t border-white/8 px-3 py-3">
              <Button onClick={handleLogout}>
                <IconLogout />
                Afmelden
              </Button>
            </div>
          </aside>
        </dialog>
      )}

      {/* ── Sidebar ─────────────────────────────────────── */}
      <aside
        className="hidden lg:flex w-56 shrink-0 flex-col bg-[#16161a] sticky top-0 h-screen overflow-y-auto"
        aria-label="Beheerpaneel navigatie"
      >
        {/* Brand */}
        <div className="flex items-center gap-2.5 border-b border-white/8 px-4 py-4">
          <Image
            src="/logo.jpg"
            alt="De Flosj"
            width={26}
            height={26}
            className="rounded-md opacity-85"
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white/90 leading-none">De Flosj</p>
            <p className="mt-0.5 font-mono text-[0.55rem] font-semibold uppercase tracking-widest text-white/35">
              Beheer
            </p>
          </div>
          <AdminThemeDropdown />
        </div>

        {/* Nav */}
        <nav className="flex flex-1 flex-col gap-5 px-3 py-4">
          {visibleSections.map((section) => (
            <div key={section.title} className="space-y-2">
              <p className="px-2.5 font-mono text-[0.55rem] font-semibold uppercase tracking-widest text-white/30">
                {section.title}
              </p>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-150 ${
                        active
                          ? "bg-pink/10 text-pink"
                          : "text-white/55 hover:bg-white/6 hover:text-white/85"
                      }`}
                    >
                      <item.Icon />
                      <span>{item.label}</span>
                      {item.comingSoon && (
                        <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide text-white/65">
                          Soon
                        </span>
                      )}
                      {item.inDevelopment && (
                        <span className="ml-auto rounded-full bg-yellow-500/10 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide text-yellow-500/65">
                          WIP
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Logout */}
        <div className="border-t border-white/8 px-3 py-3">
          <Button onClick={handleLogout}>
            <IconLogout />
            Afmelden
          </Button>
        </div>
      </aside>

      {/* ── Content ─────────────────────────────────────── */}
      <DrawerProvider>
        <div className="admin-content min-w-0 flex-1 pt-20 lg:pt-0">{children}</div>
      </DrawerProvider>
    </div>
  );
}
