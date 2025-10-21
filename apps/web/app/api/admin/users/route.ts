// apps/web/app/api/admin/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from '../../../../lib/supabaseServer';
const PAGE_SIZE = 20;

export async function GET(req: NextRequest) {
  const supabase = await getSupabaseServer();

  // ?�증
  const { data: { user }, error: uerr } = await supabase.auth.getUser();
  if (uerr) return NextResponse.json({ error: uerr.message }, { status: 500 });
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // Admin 가??
  const { data: me, error: perr } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (perr) return NextResponse.json({ error: perr.message }, { status: 500 });
  if (me?.role !== "admin") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  // 쿼리 ?�라미터
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() || "";
  const cursor = searchParams.get("cursor"); // created_at 기반 커서

  // 베이??쿼리: auth.users + profiles 조인??뷰�? ?�다�? profiles�??�용(?�메??별도 컬럼 가??
  // ?�기??profiles(email, full_name, created_at, role) 컬럼???�다�?가??
  let query = supabase
    .from("profiles")
    .select("id, email, full_name, role, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE + 1);

  if (q) {
    query = query.ilike("email", `%${q}%`)
                 .or(`full_name.ilike.%${q}%`);
  }

  if (cursor) {
    // created_at 커서보다 ?��?(?�후) ??
    query = query.lt("created_at", cursor);
  }

  const { data, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 커서 계산
  let nextCursor: string | null = null;
  let items = data ?? [];
  if (items.length > PAGE_SIZE) {
    const last = items[PAGE_SIZE - 1];
    nextCursor = last.created_at;
    items = items.slice(0, PAGE_SIZE);
  }

  // prevCursor??간단???�략?�거?? 별도 방식?�로 구현 가??
  return NextResponse.json({
    items,
    nextCursor,
    prevCursor: null,
    total: count ?? undefined,
  });
}
