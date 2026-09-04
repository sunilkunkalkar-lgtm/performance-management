export function authMode(): "demo" | "clerk" {
  return process.env.AUTH_MODE === "clerk" ? "clerk" : "demo";
}

export function clerkEnabled() {
  return authMode() === "clerk" && Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
}

export function supabaseEnabled() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  );
}

export function usesSupabase() {
  return clerkEnabled() && supabaseEnabled();
}
