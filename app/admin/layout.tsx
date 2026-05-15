"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { clearToken, getToken } from "@/lib/api";
import "./admin.css";

// ── Icons ─────────────────────────────────────────────────────────────────────

function IconGrid() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <rect x="9" y="1.5" width="5.5" height="5.5" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <rect x="1.5" y="9" width="5.5" height="5.5" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <rect x="9" y="9" width="5.5" height="5.5" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function IconTrophy() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M5 2H3a1 1 0 0 0-1 1v2a3 3 0 0 0 3 3M11 2h2a1 1 0 0 1 1 1v2a3 3 0 0 1-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M5 2h6v5a3 3 0 0 1-6 0V2Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M8 11v2M5 15h6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function IconDocument() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M9 1.5H4a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V5.5L9 1.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M9 1.5v4H13M5.5 9h5M5.5 11.5h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="1.5" y="3" width="13" height="11" rx="2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M1.5 7h13M5 1.5V4M11 1.5V4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function IconStar() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 1.5l1.8 3.64 4.01.58-2.9 2.83.68 3.97L8 10.36l-3.58 1.96.68-3.97L2.2 5.72l4-.58L8 1.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

function IconUsers() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="6" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M1 14c0-2.76 2.24-4.5 5-4.5s5 1.74 5 4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M11 7a2.5 2.5 0 1 0 0-5M15 14c0-2.76-1.34-4.5-4-4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function IconMail() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="1.5" y="3.5" width="13" height="9" rx="2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M1.5 6.5l6.5 4 6.5-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconLogout() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M6 2H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3M11 11l3-3-3-3M14 8H6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Nav config ────────────────────────────────────────────────────────────────

const navItems = [
  { href: "/admin",            label: "Dashboard", exact: true,  Icon: IconGrid     },
  { href: "/admin/toernooi",  label: "Toernooi",  exact: false, Icon: IconTrophy   },
  { href: "/admin/news",      label: "Nieuws",    exact: false, Icon: IconDocument },
  { href: "/admin/events",    label: "Events",    exact: false, Icon: IconCalendar },
  { href: "/admin/sponsors",  label: "Sponsors",  exact: false, Icon: IconStar     },
  { href: "/admin/members",   label: "Leden",     exact: false, Icon: IconUsers    },
  { href: "/admin/messages",  label: "Berichten", exact: false, Icon: IconMail     },
];

// ── Layout ────────────────────────────────────────────────────────────────────

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (pathname === "/admin/login") {
      setReady(true);
      return;
    }
    if (getToken()) {
      setReady(true);
    } else {
      router.replace("/admin/login");
    }
  }, [pathname, router]);

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  if (!ready) return null;

  function handleLogout() {
    clearToken();
    router.push("/admin/login");
  }

  return (
    <div className="flex min-h-screen bg-surface">

      {/* ── Sidebar ─────────────────────────────────────── */}
      <aside
        className="hidden lg:flex w-56 shrink-0 flex-col bg-[#16161a] sticky top-0 h-screen overflow-y-auto"
        aria-label="Beheerpaneel navigatie"
      >
        {/* Brand */}
        <div className="flex items-center gap-2.5 border-b border-white/8 px-5 py-4">
          <Image
            src="/logo.jpg"
            alt="De Flosj"
            width={26}
            height={26}
            className="rounded-md opacity-85"
          />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white/90 leading-none">De Flosj</p>
            <p className="mt-0.5 font-mono text-[0.55rem] font-semibold uppercase tracking-widest text-white/35">
              Beheer
            </p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex flex-1 flex-col gap-0.5 px-3 py-4">
          <p className="px-2.5 pb-2 font-mono text-[0.55rem] font-semibold uppercase tracking-widest text-white/30">
            Menu
          </p>
          {navItems.map((item) => {
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
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="border-t border-white/8 px-3 py-3">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-white/40 transition-colors duration-150 hover:bg-white/6 hover:text-white/75"
          >
            <IconLogout />
            Afmelden
          </button>
        </div>
      </aside>

      {/* ── Content ─────────────────────────────────────── */}
      <div className="admin-content min-w-0 flex-1">{children}</div>
    </div>
  );
}
