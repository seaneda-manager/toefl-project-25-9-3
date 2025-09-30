// apps/web/app/(protected)/admin/listening/[setId]/page.tsx
'use client';
import { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ListeningSetZ, ListeningSet } from '@/app/types/types-listening-extended';

export default function AdminListeningEditor({ params }: { params: { setId: string } }) {
  const { control, register, handleSubmit, reset, watch } = useForm<ListeningSet>({
    resolver: zodResolver(ListeningSetZ),
    defaultValues: { setId: params.setId, conversation: { id: 'conv-1', audioUrl: '', questions: [] }, lecture: { id: 'lect-1', audioUrl: '', questions: [] } },
    mode: 'onChange',
  });

  // 초기 로드 (DB→폼)
  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/listeningSet?id=${params.setId}`);
      if (res.ok) {
        const json = await res.json();
        reset(json as ListeningSet);
      }
    })();
  }, [params.setId, reset]);

  // 질문 배열 컨트롤 (대화/강의 각각)
  const convQs = useFieldArray({ control, name: 'conversation.questions' });
  const lectQs = useFieldArray({ control, name: 'lecture.questions' });

  const onSubmit = async (values: ListeningSet) => {
    const res = await fetch('/api/admin/listening/import', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values),
    });
    alert(res.ok ? 'Saved!' : 'Save failed');
  };

  // JSON 붙여넣기 → 폼 채우기
  const importJSON = async () => {
    const text = prompt('Paste JSON');
    if (!text) return;
    const obj = JSON.parse(text);
    reset(obj);
  };

  // 폼 → JSON 내보내기
  const exportJSON = () => {
    const data = watch();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${data.setId}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-4xl p-6 space-y-6">
      <h1 className="text-xl font-semibold">Listening Admin — {params.setId}</h1>

      <div className="flex gap-2">
        <button className="px-3 py-1.5 border rounded" onClick={importJSON}>Import JSON</button>
        <button className="px-3 py-1.5 border rounded" onClick={exportJSON}>Export JSON</button>
        <button className="px-3 py-1.5 bg-black text-white rounded" onClick={handleSubmit(onSubmit)}>Save</button>
      </div>

      {/* Set 메타 */}
      <section className="border rounded p-4 space-y-3 bg-white">
        <div className="grid grid-cols-3 gap-3">
          <label className="block col-span-1">Set ID<input className="input" {...register('setId')} /></label>
          <label className="block">TPO #<input className="input" type="number" {...register('tpo', { valueAsNumber: true })} /></label>
          <label className="block">Title<input className="input" {...register('title')} /></label>
        </div>
      </section>

      {/* Conversation */}
      <section className="border rounded p-4 space-y-3 bg-white">
        <h2 className="font-semibold">Conversation</h2>
        <label className="block">Audio URL<input className="input" {...register('conversation.audioUrl')} placeholder="/audio/demo-conv.mp3" /></label>
        <label className="block">Image URL<input className="input" {...register('conversation.imageUrl')} placeholder="/img/demo-conv.jpg" /></label>

        <div className="flex justify-between items-center">
          <b>Questions ({convQs.fields.length})</b>
          <button className="px-2 py-1 border rounded" onClick={() => convQs.append({ id: `c${convQs.fields.length+1}`, prompt: '', choices: [{id:'A',text:''},{id:'B',text:''}] })}>+ Add</button>
        </div>
        {convQs.fields.map((f, i) => (
          <div key={f.id} className="rounded border p-3 space-y-2">
            <div className="flex gap-2 items-end">
              <label className="block flex-1">Prompt<textarea className="input" {...register(`conversation.questions.${i}.prompt` as const)} /></label>
              <label className="block w-32">Type
                <select className="input" {...register(`conversation.questions.${i}.qtype` as const)}>
                  <option value="">(auto)</option>
                  <option value="function">function</option>
                  <option value="purpose">purpose</option>
                  <option value="detail">detail</option>
                  <option value="inference">inference</option>
                  <option value="gist">gist</option>
                </select>
              </label>
              <button className="px-2 py-1 border rounded" onClick={() => convQs.remove(i)}>Delete</button>
            </div>
            {/* 간단 choices 편집 */}
            <ChoicesEditor base={`conversation.questions.${i}.choices`} register={register} />
            {/* clip/explanation 등은 추후 확장 */}
          </div>
        ))}
      </section>

      {/* Lecture (동일 구조) */}
      <section className="border rounded p-4 space-y-3 bg-white">
        <h2 className="font-semibold">Lecture</h2>
        <label className="block">Audio URL<input className="input" {...register('lecture.audioUrl')} placeholder="/audio/demo-lect.mp3" /></label>
        <label className="block">Image URL<input className="input" {...register('lecture.imageUrl')} placeholder="/img/demo-lect.jpg" /></label>

        <div className="flex justify-between items-center">
          <b>Questions ({lectQs.fields.length})</b>
          <button className="px-2 py-1 border rounded" onClick={() => lectQs.append({ id: `l${lectQs.fields.length+1}`, prompt: '', choices: [{id:'A',text:''},{id:'B',text:''}] })}>+ Add</button>
        </div>
        {lectQs.fields.map((f, i) => (
          <div key={f.id} className="rounded border p-3 space-y-2">
            <div className="flex gap-2 items-end">
              <label className="block flex-1">Prompt<textarea className="input" {...register(`lecture.questions.${i}.prompt` as const)} /></label>
              <label className="block w-32">Type
                <select className="input" {...register(`lecture.questions.${i}.qtype` as const)}>
                  <option value="">(auto)</option>
                  <option value="function">function</option>
                  <option value="purpose">purpose</option>
                  <option value="detail">detail</option>
                  <option value="inference">inference</option>
                  <option value="gist">gist</option>
                </select>
              </label>
              <button className="px-2 py-1 border rounded" onClick={() => lectQs.remove(i)}>Delete</button>
            </div>
            <ChoicesEditor base={`lecture.questions.${i}.choices`} register={register} />
          </div>
        ))}
      </section>
    </div>
  );
}

function ChoicesEditor({ base, register }: { base: string; register: any }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {['A','B','C','D'].map((id, idx) => (
        <div key={id} className="flex items-center gap-2">
          <input type="checkbox" {...register(`${base}.${idx}.correct`)} />
          <input className="input flex-1" placeholder={`${id}) choice text`} {...register(`${base}.${idx}.text`)} />
          <input className="input w-20" defaultValue={id} {...register(`${base}.${idx}.id`)} />
        </div>
      ))}
    </div>
  );
}
