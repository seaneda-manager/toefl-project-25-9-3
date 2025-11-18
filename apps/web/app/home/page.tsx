import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export const dynamic = "force-dynamic";

type Role = "student" | "teacher" | "admin";

function normalizeRole(raw: unknown): Role {
  const v = String(raw ?? "")
    .trim()
    .toLowerCase();
  if (v === "teacher" || v === "admin" || v === "student") return v;
  return "student";
}

function roleHome(role: Role) {
  switch (role) {
    case "teacher":
      return "/home/teacher";
    case "admin":
      return "/home/admin";
    default:
      return "/home/student";
  }
}

export default async function HomeEntry() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => cookieStore.get(name)?.value,
        set() {},
        remove() {},
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return null; // 미들웨어가 처리

  // ✅ profiles 테이블에서 role 가져오기
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .maybeSingle();

  // ✅ profiles.role을 우선 사용하고 없으면 metadata fallback
  const role = normalizeRole(profile?.role ?? session.user.user_metadata?.role);

  redirect(roleHome(role));
}
