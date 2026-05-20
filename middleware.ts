import { jwtVerify } from "jose";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

async function isValidToken(token: string): Promise<boolean> {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) return false;
  try {
    await jwtVerify(token, new TextEncoder().encode(jwtSecret));
    return true;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const token = req.cookies.get("admin_token")?.value;
  if (!token || !(await isValidToken(token))) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

export const config = { matcher: ["/admin", "/admin/:path*"] };
