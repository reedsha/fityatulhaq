import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const DEFAULT_SUPABASE_URL = "https://kbyruvtdprxtdhtcteju.supabase.co";

/** Storage bucket that holds member-facing assets handed over from Web 2. */
export const FITYATULHAQ_ASSETS = process.env.SUPABASE_STORAGE_BUCKET ?? "assets";

function requireServiceRoleKey(): string {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error("MISSING_ENV_VAR: SUPABASE_SERVICE_ROLE_KEY");
  }

  return serviceRoleKey;
}

const supabaseUrl = process.env.SUPABASE_URL ?? DEFAULT_SUPABASE_URL;

/**
 * Resolved project URL, exported so the signed-URL service can build storage
 * URLs against the same host without repeating the fallback above.
 */
export const SUPABASE_PROJECT_URL = supabaseUrl;

/**
 * Privileged client — bypasses Row Level Security, so it must never be exposed
 * to the frontend or embedded in a response payload.
 *
 * Phase 1 only wires up the client; upload/download helpers for
 * `FITYATULHAQ_ASSETS` land with the profile-avatar work in Phase 2.
 */
export const supabaseAdmin: SupabaseClient = createClient(
  supabaseUrl,
  requireServiceRoleKey(),
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);