import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { hasSessionCookie } from "@/lib/session";

const useClerk =
  process.env.AUTH_MODE === "clerk" && Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

function dashboardPathForClerkId(clerkId: string): string {
  try {
    const fs = require("node:fs");
    const path = require("node:path");
    const file = path.join(process.cwd(), ".data", "pms-demo.json");
    const raw = fs.readFileSync(file, "utf8");
    const db = JSON.parse(raw);
    const profile = db.profiles?.find((p: { clerkId: string }) => p.clerkId === clerkId);
    if (!profile) return "/dashboard";
    const routes: Record<string, string> = {
      boss: "/dashboard/boss",
      hr: "/dashboard/hr",
      employee: "/dashboard/employee",
    };
    return routes[profile.role] ?? "/dashboard";
  } catch {
    return "/dashboard";
  }
}

function demoProxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = request.cookies.get("suii_session")?.value;
  const loggedIn = hasSessionCookie(session);
  const isPublic =
    pathname === "/login" ||
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/api/webhooks");

  if (!loggedIn && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (loggedIn && (pathname === "/login" || pathname.startsWith("/sign-in") || pathname === "/")) {
    const url = request.nextUrl.clone();
    const clerkId = session?.split(".")[0];
    url.pathname = clerkId ? dashboardPathForClerkId(clerkId) : "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

async function clerkProxy(request: NextRequest, event: unknown) {
  const { clerkMiddleware, createRouteMatcher } = await import("@clerk/nextjs/server");
  const isPublicRoute = createRouteMatcher([
    "/login(.*)",
    "/sign-in(.*)",
    "/sign-up(.*)",
    "/api/webhooks(.*)",
  ]);
  const handler = clerkMiddleware(async (auth, req) => {
    if (!isPublicRoute(req)) {
      await auth.protect();
    }
  });
  return handler(request, event as never);
}

const handler = useClerk ? clerkProxy : demoProxy;

export default handler;
export const proxy = handler;

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/(.*)",
  ],
};
