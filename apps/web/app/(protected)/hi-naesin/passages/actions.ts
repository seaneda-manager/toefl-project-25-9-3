'use server';

import { redirect } from 'next/navigation';
import { getServerSupabase } from '@/lib/supabase/server';

export async function startHiNaesinDrillSessionAction(
  fd: FormData,
): Promise<void> {
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('로그인 필요');

  const passageId = (fd.get('passage_id') as string)?.trim();
  if (!passageId) throw new Error('passage_id 없음');

  // 진행 중인 세션이 있으면 재사용
  const { data: existing } = await supabase
    .from('hi_naesin_sessions')
    .select('id')
    .eq('student_id', user.id)
    .eq('passage_id', passageId)
    .eq('session_type', 'drill')
    .eq('status', 'started')
    .maybeSingle();

  if (existing?.id) {
    redirect(`/hi-naesin/drill/${existing.id}?step=0`);
  }

  // 새 세션 생성
  const { data, error } = await supabase
    .from('hi_naesin_sessions')
    .insert({
      student_id:   user.id,
      passage_id:   passageId,
      session_type: 'drill',
      status:       'started',
    })
    .select('id')
    .single();

  if (error) throw new Error(error.message);

  redirect(`/hi-naesin/drill/${data.id}?step=0`);
}
