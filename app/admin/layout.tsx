"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import AuthService from "@/services/AuthService";
import { DrawerProvider } from "@/components/admin/drawer-provider";
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
} from "@/components/ui/icons";

const navItems = [
  { href: "/admin",                 label: "Dashboard",    exact: true,  Icon: IconGrid      },
  { href: "/admin/toernooi",       label: "Toernooi",     exact: false, Icon: IconTrophy    },
  { href: "/admin/inschrijvingen", label: "Inschrijving", exact: false, Icon: IconClipboard },
  { href: "/admin/news",           label: "Nieuws",       exact: false, Icon: IconDocument  },
  { href: "/admin/events",         label: "Events",       exact: false, Icon: IconCalendar  },
  { href: "/admin/sponsors",       label: "Sponsors",     exact: false, Icon: IconStar      },
  { href: "/admin/members",        label: "Leden",        exact: false, Icon: IconUsers     },
  { href: "/admin/messages",       label: "Berichten",    exact: false, Icon: IconMail      },
];

// ── Layout ────────────────────────────────────────────────────────────────────

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const router = useRouter();
  const pathname = usePathname();

  function handleLogout() {
    AuthService.logout();
    router.push("/login");
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
          <Button onClick={handleLogout} >
            <IconLogout />
            Afmelden
          </Button>
        </div>
      </aside>

      {/* ── Content ─────────────────────────────────────── */}
      <DrawerProvider>
        <div className="admin-content min-w-0 flex-1">{children}</div>
      </DrawerProvider>
    </div>
  );
}
