import { redirect } from "next/navigation";
// ⬇️ 기존 "@/lib/supabase/server" 말고, 실제 파일 이름에 맞춰서!
import { supabaseServer } from "@/lib/supabaseServer";
import UpdatePasswordClient from "./UpdatePasswordClient";

export const dynamic = "force-dynamic";

export default async function Page() {
  const supabase = supabaseServer();

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (!session || error) {
    redirect("/auth/login");
  }

  return <UpdatePasswordClient />;
}
