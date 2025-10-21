// apps/web/app/api/listeningSet/route.ts
import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';

// ✅ 타입/스키마는 웹앱 전용 types 위치로 고정
import type { ListeningTrack, LQuestion } from '@/types/types-listening';
import { ListeningSetZ } from '@/types/types-listening-extended';

// 러너가 기대하는 최종 형태
type LoadedSet = {
  setId: string;
  conversation: ListeningTrack & { title?: string; imageUrl?: string };
  lecture: ListeningTrack & { title?: string; imageUrl?: string };
};

// ────────────────────────────────────────────────────────────
// 데모 세트(데이터가 없거나 id=demo-set일 때 반환)
// ────────────────────────────────────────────────────────────
function buildDemoSet(id: string): LoadedSet {
  const q1: LQuestion = {
    id: 'cq1',
    number: 1,
    prompt: 'What is the woman mainly concerned about?',
    choices: [
      { id: 'a', text: 'Submitting her assignment on time.' },
      { id: 'b', text: 'Choosing a topic for her paper.' },
      { id: 'c', text: 'Rescheduling an exam.' },
      { id: 'd', text: 'Finding a study partner.' },
    ],
  };

  const q2 = {
    id: 'cq2',
    number: 2,
    prompt: 'Why does the man say this?',
    meta: {
      tag: 'why-say-this',
      autoPlaySnippetUrl: '/audio/conv1-snippet-q2.mp3',
      revealChoicesAfterAudio: true,
      allowReplayInPractice: true,
    },
    choices: [
      { id: 'a', text: 'To clarify a misunderstanding' },
      { id: 'b', text: 'To show disagreement' },
      { id: 'c', text: 'To change the topic' },
      { id: 'd', text: 'To give an example' },
    ],
  } as unknown as LQuestion;

  const lq1: LQuestion = {
    id: 'lq1',
    number: 3,
    prompt: 'According to the lecture, what was a major factor in fossil preservation?',
    choices: [
      { id: 'a', text: 'Rapid burial in sediment' },
      { id: 'b', text: 'Exposure to oxygen' },
      { id: 'c', text: 'Frequent volcanic activity' },
      { id: 'd', text: 'High levels of UV radiation' },
    ],
  };

  return {
    setId: id,
    conversation: {
      id: 'conv-1',
      title: 'Conversation · Office Hours',
      imageUrl: '/images/conv-office-hours.jpg',
      audioUrl: '/audio/conv1-full.mp3',
      questions: [q1, q2],
    },
    lecture: {
      id: 'lec-1',
      title: 'Lecture · Paleontology',
      imageUrl: '/images/lecture-fossils.jpg',
      audioUrl: '/audio/lec1-full.mp3',
      questions: [lq1],
    },
  };
}

// ListeningSetZ 스펙을 LoadedSet으로 정규화
function normalizeToLoadedSet(id: string, spec: any): LoadedSet {
  const looksLoaded =
    spec &&
    typeof spec === 'object' &&
    spec.conversation?.audioUrl &&
    spec.lecture?.audioUrl &&
    Array.isArray(spec.conversation?.questions) &&
    Array.isArray(spec.lecture?.questions);

  if (looksLoaded) {
    return {
      setId: spec.setId ?? id,
      conversation: spec.conversation,
      lecture: spec.lecture,
    } as LoadedSet;
  }

  const fixTrack = (t: any) => {
    if (!t) return null;

    const audioUrl = t.audioUrl ?? t.audio_url ?? t.audio ?? '';
    const imageUrl = t.imageUrl ?? t.image_url ?? undefined;
    const title = t.title ?? t.name ?? undefined;

    const questions = (t.questions ?? []).map((q: any, idx: number) => {
      const prompt = q.prompt ?? q.stem ?? q.text ?? q.body ?? '';
      const number = q.number ?? q.no ?? idx + 1;
      const choices = (q.choices ?? q.options ?? []).map((c: any) => ({
        id: String(c.id ?? c.value ?? c.key ?? `${q.id ?? 'q'}-${Math.random().toString(36).slice(2, 6)}`),
        text: c.text ?? c.label ?? String(c.id ?? ''),
      }));

      const out: LQuestion = {
        id: String(q.id ?? `${t.id}-q${number}`),
        number,
        prompt,
        choices,
      };
      if (q.meta) (out as any).meta = q.meta;
      return out;
    });

    return {
      id: String(t.id),
      audioUrl,
      imageUrl,
      title,
      questions,
    } as ListeningTrack & { title?: string; imageUrl?: string };
  };

  const conversation = fixTrack(spec.conversation);
  const lecture = fixTrack(spec.lecture);
  if (!conversation || !lecture) {
    throw new Error('invalid spec structure');
  }

  return { setId: id, conversation, lecture };
}

export async function GET(req: Request) {
  try {
    const supabase = await getSupabaseServer();

    // 0) 인증
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr) return NextResponse.json({ error: userErr.message }, { status: 500 });
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    // 1) 파라미터
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id') || 'demo-set';

    // 2) 데모 세트 즉시 반환
    if (id === 'demo-set') {
      return NextResponse.json(buildDemoSet(id));
    }

    // 3) 접근 권한 확인
    const { data: allow, error: allowErr } = await supabase
      .from('v_user_listening_sets')
      .select('id, downloaded')
      .eq('user_id', user.id)
      .eq('id', id)
      .maybeSingle();

    if (allowErr) return NextResponse.json({ error: allowErr.message }, { status: 400 });
    if (!allow || allow.downloaded !== true) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    // 4) listening_sets.spec 로드
    const { data, error } = await supabase
      .from('listening_sets')
      .select('spec')
      .eq('id', id)
      .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    // 4-1) 스펙 없으면 데모로 대체(200)
    if (!data?.spec) {
      return NextResponse.json(buildDemoSet('demo-set'), { status: 200 });
    }

    // 5) Zod 검증 → 정규화 → 응답
    const parsed = ListeningSetZ.safeParse(data.spec);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'invalid spec', issues: parsed.error.flatten() },
        { status: 422 }
      );
    }

    const payload = normalizeToLoadedSet(id, parsed.data);
    return NextResponse.json(payload, { status: 200 });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 });
  }
}
