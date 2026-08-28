import { NextResponse } from "next/server";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import { getDb } from "@/lib/pms/context";

export async function POST(req: Request) {
  const payload = await req.json().catch(() => null);
  const type = payload?.type as string | undefined;
  const data = payload?.data as
    | { id?: string; email_addresses?: { email_address?: string }[]; first_name?: string; last_name?: string; image_url?: string }
    | undefined;
  if (!type || !data?.id) {
    return NextResponse.json({ error: "Invalid webhook" }, { status: 400 });
  }
  if (!type.startsWith("user.")) {
    return NextResponse.json({ ok: true });
  }

  const email = data.email_addresses?.[0]?.email_address?.toLowerCase();
  const fullName = [data.first_name, data.last_name].filter(Boolean).join(" ") || email || "New teammate";

  const admin = createServiceSupabaseClient();
  if (admin && email) {
    const { data: existing } = await admin.from("profiles").select("id").eq("email", email).maybeSingle();
    if (existing) {
      await admin.from("profiles").update({ clerk_id: data.id, full_name: fullName, avatar_url: data.image_url ?? null }).eq("id", existing.id);
    } else if (type === "user.created") {
      await admin.from("profiles").insert({
        clerk_id: data.id,
        email,
        full_name: fullName,
        role: "employee",
        avatar_url: data.image_url ?? null,
      });
    }
  } else if (email) {
    const db = getDb();
    const profile = db.profiles.find((p) => p.email === email);
    if (profile) profile.clerkId = data.id;
  }

  return NextResponse.json({ ok: true });
}
