import { createClient } from "@supabase/supabase-js";

export function createServerSupabaseClient(getToken: () => Promise<string | null>) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key, {
    async accessToken() {
      return getToken();
    },
  });
}

export function createServiceSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !service) return null;
  return createClient(url, service, { auth: { persistSession: false } });
}
