// apps/web/app/(protected)/listening/page.tsx
export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { getSupabaseServer } from '@/lib/supabaseServer';

// ✅ 네 스키마에 맞춰 아래 RPC/쿼리를 바꿀 수 있어요.
// 가급적 RPC(예: listening_available_sets)로 소유/다운로드 여부를 캡슐화하는 걸 추천.
type AvailSet = { id: string; tpo: number; title: string };

export default async function Page() {
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    // (protected) 그룹이면 여기 안 오지만, 혹시 모르니…
    return <div className="p-6">Please sign in.</div>;
  }

  // ① RPC가 있다면
  // const { data: sets, error } = await supabase.rpc<AvailSet[]>('listening_available_sets', { p_user_id: user.id });

  // ② 테이블 조인으로 직접 (예시: user가 다운로드한 세트만)
  // --- 스키마에 맞게 수정하세요 ---
  const { data: sets, error } = await supabase
    .from('v_user_listening_sets') // 예: 뷰 또는 조인 결과
    .select('id,tpo,title')
    .eq('user_id', user.id)
    .eq('downloaded', true)
    .order('tpo', { ascending: true }) as unknown as { data: AvailSet[] | null, error: any };

  if (error) {
    return <div className="p-6 text-red-600">Load error: {error.message}</div>;
  }
  if (!sets || sets.length === 0) {
    // ✅ 데이터 없으면 접근 자체를 막기: 여기서 그냥 빈 화면/안내
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold mb-3">Listening</h1>
        <p className="text-sm text-neutral-600">다운로드된 TPO가 없습니다. 먼저 자료를 다운로드하세요.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl p-6 space-y-4">
      <h1 className="text-xl font-semibold">Choose a TPO</h1>
      <form className="rounded-2xl border bg-white p-4 space-y-3">
        <label className="block">
          <span className="text-sm">TPO #</span>
          <select className="w-full border rounded p-2" defaultValue={sets[0]?.id} id="set">
            {sets.map(s => (
              <option key={s.id} value={s.id}>
                TPO {s.tpo} — {s.title}
              </option>
            ))}
          </select>
        </label>
        <div className="flex gap-2">
          {/* 시작 버튼은 러너 가드가 있는 라우트로 이동 */}
          <Link
            href={`/listening/test/${sets[0].id}`}
            onClick={(e) => {
              const sel = (document.getElementById('set') as HTMLSelectElement | null)?.value;
              if (sel) (e.currentTarget as HTMLAnchorElement).href = `/listening/test/${sel}`;
            }}
            className="px-4 py-2 rounded bg-black text-white"
          >
            Start
          </Link>
        </div>
      </form>
      <p className="text-xs text-neutral-500">목록에는 다운로드 완료된 회차만 표시됩니다.</p>
    </div>
  );
}
