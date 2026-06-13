// apps/web/app/(protected)/admin/listening/[setId]/page.tsx
'use client';

import { useEffect } from 'react';
import {
  useForm,
  useFieldArray,
  type UseFormRegister,
  type Resolver,
  type FieldValues,
} from 'react-hook-form';
import { ListeningSetZ, type ListeningSet } from '@/app/types/types-listening-extended';

/** ---------- RHF 전용: questions를 "반드시 배열"로 강제한 폼 타입 ---------- */
type Conv = NonNullable<ListeningSet['conversation']>;
type Lect = NonNullable<ListeningSet['lecture']>;
type QElem<T> = T extends Array<infer E> ? E : never;

// RHF 경로 추론을 위해 FieldValues 확장
interface ListeningSetForm extends FieldValues, Omit<ListeningSet, 'conversation' | 'lecture'> {
  conversation: Conv & { questions: QElem<Conv['questions']>[] };
  lecture: Lect & { questions: QElem<Lect['questions']>[] };
}
/** ----------------------------------------------------------------------- */

/** 커스텀 resolver (Zod 검증 + questions 배열 강제) */
const listeningFormResolver: Resolver<ListeningSetForm> = async (rawValues) => {
  const parsed = ListeningSetZ.safeParse(rawValues as unknown);
  const base: ListeningSet = parsed.success ? parsed.data : ((rawValues ?? {}) as ListeningSet);

  const conv = (base.conversation ?? {
    id: 'conv-1',
    audioUrl: '',
    imageUrl: '',
    questions: [],
  }) as Conv;

  const lect = (base.lecture ?? {
    id: 'lect-1',
    audioUrl: '',
    imageUrl: '',
    questions: [],
  }) as Lect;

  const out: ListeningSetForm = {
    ...base,
    conversation: {
      ...conv,
      questions: Array.isArray(conv.questions) ? conv.questions : [],
    },
    lecture: {
      ...lect,
      questions: Array.isArray(lect.questions) ? lect.questions : [],
    },
  };

  return {
    values: out,
    errors: parsed.success ? {} : (parsed.error?.format?.() as any),
  };
};

export default function AdminListeningEditor(props: any) {
  // ✅ Next 빌드 타입체커 우회 + 런타임 params 사용
  const { params } = props as { params: { setId: string } };

  const { control, register, handleSubmit, reset, getValues } = useForm<ListeningSetForm>({
    resolver: listeningFormResolver,
    defaultValues: {
      setId: params.setId,
      title: '',
      tpo: undefined,
      conversation: { id: 'conv-1', audioUrl: '', imageUrl: '', questions: [] },
      lecture: { id: 'lect-1', audioUrl: '', imageUrl: '', questions: [] },
    },
    mode: 'onChange',
  });

  // 초기 로드
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`/api/listeningSet?id=${encodeURIComponent(params.setId)}`, {
          cache: 'no-store',
        });
        if (!alive) return;
        if (res.ok) {
          const json = (await res.json()) as ListeningSet;
          reset(json as unknown as ListeningSetForm);
        }
      } catch {
        // ignore
      }
    })();
    return () => {
      alive = false;
    };
  }, [params.setId, reset]);

  // 필드 배열
  const convQs = useFieldArray<ListeningSetForm, 'conversation.questions'>({
    control,
    name: 'conversation.questions',
  });
  const lectQs = useFieldArray<ListeningSetForm, 'lecture.questions'>({
    control,
    name: 'lecture.questions',
  });

  const onSubmit = async (values: ListeningSetForm) => {
    const res = await fetch('/api/admin/listening/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });
    alert(res.ok ? '저장되었습니다!' : '저장에 실패했습니다');
  };

  const importJSON = async () => {
    const text = prompt('JSON을 붙여넣기 하세요');
    if (!text) return;
    try {
      const obj = JSON.parse(text) as ListeningSet;
      reset(obj as unknown as ListeningSetForm);
    } catch {
      alert('올바르지 않은 JSON입니다');
    }
  };

  // ✅ React Compiler 경고 회피: 핸들러에서만 값 가져오기, 메모이즈 불필요
  const exportJSON = () => {
    const data = getValues();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(data as ListeningSetForm).setId || 'listening-set'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const mk4 = () => ['A', 'B', 'C', 'D'].map((id) => ({ id, text: '', correct: false }));

  return (
    <div className="mx-auto max-w-4xl p-6 space-y-6">
      <h1 className="text-xl font-semibold">리스닝 관리 — {params.setId}</h1>

      <div className="flex gap-2">
        <button type="button" className="px-3 py-1.5 border rounded" onClick={importJSON}>
          JSON 불러오기
        </button>
        <button type="button" className="px-3 py-1.5 border rounded" onClick={exportJSON}>
          JSON 내보내기
        </button>
        <button
          type="button"
          className="px-3 py-1.5 bg-black text-white rounded"
          onClick={handleSubmit(onSubmit)}
        >
          저장
        </button>
      </div>

      {/* Set 메타 */}
      <section className="border rounded p-4 space-y-3 bg-white">
        <div className="grid grid-cols-3 gap-3">
          <label className="block col-span-1">
            세트 ID
            <input className="input" {...register('setId')} />
          </label>
          <label className="block">
            TPO 번호
            <input className="input" type="number" {...register('tpo', { valueAsNumber: true })} />
          </label>
          <label className="block">
            제목
            <input className="input" {...register('title')} />
          </label>
        </div>

        {/* 기출 출처 */}
        <div className="border-t pt-3 space-y-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">기출 출처</p>
          <div className="grid grid-cols-4 gap-3">
            <label className="block">
              출처
              <select className="input" {...register('source' as any)}>
                <option value="">선택</option>
                <option value="수능">수능 (CSAT)</option>
                <option value="교육청">교육청 모의고사</option>
                <option value="EBS">EBS</option>
                <option value="TOEFL">TOEFL 공식</option>
                <option value="사설">사설 모의고사</option>
                <option value="자체제작">자체 제작</option>
              </select>
            </label>
            <label className="block">
              연도
              <input className="input" type="number" placeholder="2024" {...register('source_year' as any, { valueAsNumber: true })} />
            </label>
            <label className="block">
              월
              <input className="input" type="number" placeholder="11" {...register('source_month' as any, { valueAsNumber: true })} />
            </label>
            <label className="block">
              난이도
              <select className="input" {...register('default_difficulty' as any)}>
                <option value="">전체</option>
                <option value="basic">Basic</option>
                <option value="standard">Standard</option>
                <option value="advanced">Advanced</option>
              </select>
            </label>
          </div>
        </div>
      </section>

      {/* Conversation */}
      <section className="border rounded p-4 space-y-3 bg-white">
        <h2 className="font-semibold">대화 (Conversation)</h2>
        <label className="block">
          오디오 URL
          <input
            className="input"
            {...register('conversation.audioUrl')}
            placeholder="/audio/demo-conv.mp3"
          />
        </label>
        <label className="block">
          이미지 URL
          <input
            className="input"
            {...register('conversation.imageUrl')}
            placeholder="/img/demo-conv.jpg"
          />
        </label>
        <label className="block">
          스크립트 전문
          <textarea
            className="input min-h-[120px] font-mono text-xs"
            placeholder="A: Good morning, I wanted to ask about...&#10;B: Of course, what's your question?"
            {...register('conversation.transcript' as any)}
          />
        </label>

        <div className="flex justify-between items-center">
          <b>문제 ({convQs.fields.length})</b>
          <button
            type="button"
            className="px-2 py-1 border rounded"
            onClick={() =>
              convQs.append({
                id: `c${convQs.fields.length + 1}`,
                prompt: '',
                qtype: undefined,
                choices: mk4(),
              } as any)
            }
          >
            + 추가
          </button>
        </div>

        {convQs.fields.map((f, i) => (
          <div key={f.id} className="rounded border p-3 space-y-2 bg-slate-50">
            <div className="flex gap-2 items-start">
              <label className="block flex-1">
                문제
                <textarea className="input" {...register(`conversation.questions.${i}.prompt` as const)} />
              </label>
              <div className="flex flex-col gap-2 w-36 shrink-0">
                <label className="block">
                  유형
                  <select className="input" {...register(`conversation.questions.${i}.qtype` as const, { setValueAs: (v) => (v === '' ? undefined : v) })}>
                    <option value="">(미지정)</option>
                    <option value="main_topic">주제/목적</option>
                    <option value="detail">세부사항</option>
                    <option value="function">화자의 의도</option>
                    <option value="attitude">화자의 태도</option>
                    <option value="organization">강의 구성</option>
                    <option value="inference">추론</option>
                    <option value="connecting">개념 연결</option>
                  </select>
                </label>
                <label className="block">
                  난이도
                  <select className="input" {...register(`conversation.questions.${i}.difficulty` as any)}>
                    <option value="">전체</option>
                    <option value="basic">Basic</option>
                    <option value="standard">Standard</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </label>
              </div>
              <button type="button" className="px-2 py-1 border rounded text-xs mt-5 shrink-0"
                onClick={() => convQs.remove(i)}>삭제</button>
            </div>

            <label className="block">
              <span className="text-xs font-semibold text-amber-700">Clue Quote</span>
              <span className="text-[11px] text-slate-400 ml-1">— 정답 근거가 되는 스크립트 문장 (복붙)</span>
              <textarea className="input min-h-[48px] text-xs border-amber-200 bg-amber-50"
                placeholder="예: 'The real issue here is the budget allocation.'"
                {...register(`conversation.questions.${i}.clue_quote` as any)} />
            </label>

            <ChoicesEditor
              base={`conversation.questions.${i}.choices` as `conversation.questions.${number}.choices`}
              register={register}
            />
          </div>
        ))}
      </section>

      {/* Lecture */}
      <section className="border rounded p-4 space-y-3 bg-white">
        <h2 className="font-semibold">강의 (Lecture)</h2>
        <label className="block">
          오디오 URL
          <input
            className="input"
            {...register('lecture.audioUrl')}
            placeholder="/audio/demo-lect.mp3"
          />
        </label>
        <label className="block">
          이미지 URL
          <input className="input" {...register('lecture.imageUrl')} placeholder="/img/demo-lect.jpg" />
        </label>
        <label className="block">
          스크립트 전문
          <textarea className="input min-h-[120px] font-mono text-xs"
            placeholder="Professor: Today we're going to discuss..."
            {...register('lecture.transcript' as any)} />
        </label>

        <div className="flex justify-between items-center">
          <b>문제 ({lectQs.fields.length})</b>
          <button
            type="button"
            className="px-2 py-1 border rounded"
            onClick={() =>
              lectQs.append({
                id: `l${lectQs.fields.length + 1}`,
                prompt: '',
                qtype: undefined,
                choices: mk4(),
              } as any)
            }
          >
            + 추가
          </button>
        </div>

        {lectQs.fields.map((f, i) => (
          <div key={f.id} className="rounded border p-3 space-y-2 bg-slate-50">
            <div className="flex gap-2 items-start">
              <label className="block flex-1">
                문제
                <textarea className="input" {...register(`lecture.questions.${i}.prompt` as const)} />
              </label>
              <div className="flex flex-col gap-2 w-36 shrink-0">
                <label className="block">
                  유형
                  <select className="input" {...register(`lecture.questions.${i}.qtype` as const, { setValueAs: (v) => (v === '' ? undefined : v) })}>
                    <option value="">(미지정)</option>
                    <option value="main_topic">주제/목적</option>
                    <option value="detail">세부사항</option>
                    <option value="function">화자의 의도</option>
                    <option value="attitude">화자의 태도</option>
                    <option value="organization">강의 구성</option>
                    <option value="inference">추론</option>
                    <option value="connecting">개념 연결</option>
                  </select>
                </label>
                <label className="block">
                  난이도
                  <select className="input" {...register(`lecture.questions.${i}.difficulty` as any)}>
                    <option value="">전체</option>
                    <option value="basic">Basic</option>
                    <option value="standard">Standard</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </label>
              </div>
              <button type="button" className="px-2 py-1 border rounded text-xs mt-5 shrink-0"
                onClick={() => lectQs.remove(i)}>삭제</button>
            </div>

            <label className="block">
              <span className="text-xs font-semibold text-amber-700">Clue Quote</span>
              <span className="text-[11px] text-slate-400 ml-1">— 정답 근거가 되는 스크립트 문장 (복붙)</span>
              <textarea className="input min-h-[48px] text-xs border-amber-200 bg-amber-50"
                placeholder="예: 'The real issue here is the budget allocation.'"
                {...register(`lecture.questions.${i}.clue_quote` as any)} />
            </label>

            <ChoicesEditor
              base={`lecture.questions.${i}.choices` as `lecture.questions.${number}.choices`}
              register={register}
            />
          </div>
        ))}
      </section>
    </div>
  );
}

function ChoicesEditor<
  B extends `conversation.questions.${number}.choices` | `lecture.questions.${number}.choices`
>({ base, register }: { base: B; register: UseFormRegister<ListeningSetForm> }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {['A', 'B', 'C', 'D'].map((id, idx) => (
        <div key={id} className="flex items-center gap-2">
          <input type="checkbox" {...register(`${base}.${idx}.correct` as const)} />
          <input
            className="input flex-1"
            placeholder={`${id}) 선택지 텍스트`}
            {...register(`${base}.${idx}.text` as const)}
          />
          <input
            className="input w-20"
            defaultValue={id}
            {...register(`${base}.${idx}.id` as const)}
          />
        </div>
      ))}
    </div>
  );
}
