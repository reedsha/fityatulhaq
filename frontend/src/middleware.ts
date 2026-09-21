import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/middleware";

/**
 * Root middleware: refreshes Supabase auth sessions on every matching request
 * (official Supabase SSR pattern).
 */
export async function middleware(request: NextRequest) {
  const { supabase, supabaseResponse } = createClient(request);

  // Forces a session/token check and refreshes cookies when near expiry.
  await supabase.auth.getUser();

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Run on everything except:
     * - Next.js internals (_next/static, _next/image)
     * - favicon.ico
     * - common static assets (svg/png/jpg/jpeg/gif/webp)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};