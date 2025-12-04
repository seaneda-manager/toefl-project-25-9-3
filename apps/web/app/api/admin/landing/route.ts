import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";

const LANDING_KEY = "landing_home_v1";

async function guardAdmin() {
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, status: 401 as const, error: "unauthorized" };
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    return { supabase, status: 500 as const, error: error.message };
  }
  if (!profile || profile.role !== "admin") {
    return { supabase, status: 403 as const, error: "forbidden" };
  }

  return { supabase, status: 200 as const, error: null };
}

export async function GET() {
  const { supabase, status, error } = await guardAdmin();
  if (status !== 200) {
    return NextResponse.json({ error }, { status });
  }

  const { data, error: qerr } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", LANDING_KEY)
    .maybeSingle();

  if (qerr) {
    return NextResponse.json({ error: qerr.message }, { status: 500 });
  }

  return NextResponse.json(data?.value ?? {});
}

export async function PUT(req: Request) {
  const { supabase, status, error } = await guardAdmin();
  if (status !== 200) {
    return NextResponse.json({ error }, { status });
  }

  const body = await req.json(); // LandingConfig
  const { error: uerr } = await supabase
    .from("site_settings")
    .upsert({ key: LANDING_KEY, value: body });

  if (uerr) {
    return NextResponse.json({ error: uerr.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
