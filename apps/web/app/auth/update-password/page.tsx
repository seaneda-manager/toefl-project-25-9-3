// apps/web/app/auth/update-password/page.tsx
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabaseServer";
import UpdatePasswordClient from "./UpdatePasswordClient";

export const dynamic = "force-dynamic";

export default async function Page() {
  // 함수 호출 X — 이미 생성된 클라이언트 객체를 그대로 사용
  const supabase = supabaseServer;

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (!session || error) {
    redirect("/auth/login");
  }

  return <UpdatePasswordClient />;
}
