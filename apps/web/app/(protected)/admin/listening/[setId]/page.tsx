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
    alert(res.ok ? 'Saved!' : 'Save failed');
  };

  const importJSON = async () => {
    const text = prompt('Paste JSON');
    if (!text) return;
    try {
      const obj = JSON.parse(text) as ListeningSet;
      reset(obj as unknown as ListeningSetForm);
    } catch {
      alert('Invalid JSON');
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
      <h1 className="text-xl font-semibold">Listening Admin — {params.setId}</h1>

      <div className="flex gap-2">
        <button type="button" className="px-3 py-1.5 border rounded" onClick={importJSON}>
          Import JSON
        </button>
        <button type="button" className="px-3 py-1.5 border rounded" onClick={exportJSON}>
          Export JSON
        </button>
        <button
          type="button"
          className="px-3 py-1.5 bg-black text-white rounded"
          onClick={handleSubmit(onSubmit)}
        >
          Save
        </button>
      </div>

      {/* Set 메타 */}
      <section className="border rounded p-4 space-y-3 bg-white">
        <div className="grid grid-cols-3 gap-3">
          <label className="block col-span-1">
            Set ID
            <input className="input" {...register('setId')} />
          </label>
          <label className="block">
            TPO #
            <input className="input" type="number" {...register('tpo', { valueAsNumber: true })} />
          </label>
          <label className="block">
            Title
            <input className="input" {...register('title')} />
          </label>
        </div>
      </section>

      {/* Conversation */}
      <section className="border rounded p-4 space-y-3 bg-white">
        <h2 className="font-semibold">Conversation</h2>
        <label className="block">
          Audio URL
          <input
            className="input"
            {...register('conversation.audioUrl')}
            placeholder="/audio/demo-conv.mp3"
          />
        </label>
        <label className="block">
          Image URL
          <input
            className="input"
            {...register('conversation.imageUrl')}
            placeholder="/img/demo-conv.jpg"
          />
        </label>

        <div className="flex justify-between items-center">
          <b>Questions ({convQs.fields.length})</b>
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
            + Add
          </button>
        </div>

        {convQs.fields.map((f, i) => (
          <div key={f.id} className="rounded border p-3 space-y-2">
            <div className="flex gap-2 items-end">
              <label className="block flex-1">
                Prompt
                <textarea
                  className="input"
                  {...register(`conversation.questions.${i}.prompt` as const)}
                />
              </label>
              <label className="block w-32">
                Type
                <select
                  className="input"
                  {...register(`conversation.questions.${i}.qtype` as const, {
                    setValueAs: (v) => (v === '' ? undefined : v),
                  })}
                >
                  <option value="">(auto)</option>
                  <option value="function">function</option>
                  <option value="purpose">purpose</option>
                  <option value="detail">detail</option>
                  <option value="inference">inference</option>
                  <option value="gist">gist</option>
                  <option value="attitude">attitude</option>
                  <option value="organization">organization</option>
                </select>
              </label>
              <button
                type="button"
                className="px-2 py-1 border rounded"
                onClick={() => convQs.remove(i)}
                aria-label={`Delete conversation question ${i + 1}`}
              >
                Delete
              </button>
            </div>

            <ChoicesEditor
              base={`conversation.questions.${i}.choices` as `conversation.questions.${number}.choices`}
              register={register}
            />
          </div>
        ))}
      </section>

      {/* Lecture */}
      <section className="border rounded p-4 space-y-3 bg-white">
        <h2 className="font-semibold">Lecture</h2>
        <label className="block">
          Audio URL
          <input
            className="input"
            {...register('lecture.audioUrl')}
            placeholder="/audio/demo-lect.mp3"
          />
        </label>
        <label className="block">
          Image URL
          <input
            className="input"
            {...register('lecture.imageUrl')}
            placeholder="/img/demo-lect.jpg"
          />
        </label>

        <div className="flex justify-between items-center">
          <b>Questions ({lectQs.fields.length})</b>
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
            + Add
          </button>
        </div>

        {lectQs.fields.map((f, i) => (
          <div key={f.id} className="rounded border p-3 space-y-2">
            <div className="flex gap-2 items-end">
              <label className="block flex-1">
                Prompt
                <textarea
                  className="input"
                  {...register(`lecture.questions.${i}.prompt` as const)}
                />
              </label>
              <label className="block w-32">
                Type
                <select
                  className="input"
                  {...register(`lecture.questions.${i}.qtype` as const, {
                    setValueAs: (v) => (v === '' ? undefined : v),
                  })}
                >
                  <option value="">(auto)</option>
                  <option value="function">function</option>
                  <option value="purpose">purpose</option>
                  <option value="detail">detail</option>
                  <option value="inference">inference</option>
                  <option value="gist">gist</option>
                  <option value="attitude">attitude</option>
                  <option value="organization">organization</option>
                </select>
              </label>
              <button
                type="button"
                className="px-2 py-1 border rounded"
                onClick={() => lectQs.remove(i)}
                aria-label={`Delete lecture question ${i + 1}`}
              >
                Delete
              </button>
            </div>

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
            placeholder={`${id}) choice text`}
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
