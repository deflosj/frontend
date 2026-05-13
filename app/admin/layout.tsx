"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearToken, getToken } from "@/lib/api";
import "./admin.css";

const navItems = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/news", label: "Nieuws" },
  { href: "/admin/events", label: "Events" },
  { href: "/admin/sponsors", label: "Sponsors" },
  { href: "/admin/members", label: "Leden" },
  { href: "/admin/messages", label: "Berichten" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (pathname === "/admin/login") {
      setReady(true);
      return;
    }
    if (!getToken()) {
      router.replace("/admin/login");
    } else {
      setReady(true);
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
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar__brand">
          <strong>De Flosj</strong>
          <small>BEHEERDERSPANEEL</small>
        </div>

        <nav className="admin-nav" aria-label="Beheernavigatie">
          <p className="admin-nav__label">Menu</p>
          {navItems.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`admin-nav__link${active ? " active" : ""}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="admin-sidebar__footer">
          <button className="admin-logout" onClick={handleLogout} type="button">
            Afmelden
          </button>
        </div>
      </aside>

      <div className="admin-content">{children}</div>
    </div>
  );
}
