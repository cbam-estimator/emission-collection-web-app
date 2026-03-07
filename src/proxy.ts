import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import createMiddleware from "next-intl/middleware";
import { type NextRequest } from "next/server";

import { routing } from "@/i18n/routing";

const intlMiddleware = createMiddleware(routing);

const isPublicRoute = createRouteMatcher([
  "/:locale/sign-in(.*)",
  "/:locale/sign-up(.*)",
]);

const isApiRoute = createRouteMatcher(["/(api|trpc)(.*)"]);

export const proxy = clerkMiddleware(async (auth, request: NextRequest) => {
  // Auth — protect all non-public routes
  if (!isPublicRoute(request)) {
    await auth.protect();
  }

  // Skip i18n for API/tRPC routes
  if (isApiRoute(request)) return;

  // i18n — handle locale routing
  return intlMiddleware(request);
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API and tRPC routes
    "/(api|trpc)(.*)",
  ],
};
