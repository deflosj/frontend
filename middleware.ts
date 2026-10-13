import { jwtVerify } from "jose";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_ROLES, homeForRole, isPageAllowed } from "./lib/routePermissions";

async function getRoleFromToken(token: string): Promise<string | null> {
  const secret = process.env.JWT_SECRET;
  if (!secret) return null;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    const role = payload["role"];
    return typeof role === "string" ? role : null;
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const token = req.cookies.get("admin_token")?.value;
  if (!token) return NextResponse.redirect(new URL("/login", req.url));

  const role = await getRoleFromToken(token);
  if (!role) return NextResponse.redirect(new URL("/login", req.url));

  // Block non-admin roles from the panel entirely
  if (!(ADMIN_ROLES as string[]).includes(role)) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Enforce per-page restrictions
  const { pathname } = req.nextUrl;
  if (!isPageAllowed(role, pathname)) {
    // Naar de eigen startpagina (scheidsrechter: eventdag), nooit naar een
    // pagina die zelf ook geweigerd wordt — anders loopt dit in een cirkel.
    const home = homeForRole(role);
    if (pathname === home) return NextResponse.redirect(new URL("/login", req.url));
    return NextResponse.redirect(new URL(home, req.url));
  }

  return NextResponse.next();
}

export const config = { matcher: ["/admin", "/admin/:path*"] };
