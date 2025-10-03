'use client';
import { useEffect, useState } from 'react';
import { upsertReadingSet, loadReadingSet } from '@/actions/reading';
import { validateSet } from '@/lib/reading/validate';
import type { RSet } from '@/types/types-reading';

export default function Page({ params }: { params: { setId: string } }) {
  const [data, setData] = useState<RSet>({ id: params.setId, label: '', passages: [] });
  const [errs, setErrs] = useState<string[]>([]);
  const [msg, setMsg] = useState<string>('');

  useEffect(() => {
    (async () => {
      const loaded = await loadReadingSet(params.setId);
      if (loaded != null) setData(loaded as RSet); // <- truthiness가 아닌 null 체크
    })();
  }, [params.setId]);

  const onImport = async (file: File) => {
    const text = await file.text();
    const json = JSON.parse(text) as RSet;
    setData(json);
  };

  const onValidate = () => {
    const e = validateSet(data);
    setErrs(e);
    setMsg(e.length ? `Errors: ${e.length}` : 'All good ✅');
  };

  const onSave = async () => {
    const e = validateSet(data);
    if (e.length) { setErrs(e); setMsg(`Fix errors first (${e.length})`); return; }
    const res = await upsertReadingSet(data);
    setMsg(res?.ok ? 'Saved ✅' : 'Save failed');
  };

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Reading Set: {data.id}</h1>
        <div className="flex gap-2">
          <label className="cursor-pointer rounded border px-3 py-2">
            Import JSON
            <input
              type="file"
              className="hidden"
              accept="application/json"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) { void onImport(f); } // <- truthiness 테스트 금지
              }}
            />
          </label>
          <button className="rounded border px-3 py-2" onClick={onValidate}>Validate</button>
          <button className="rounded border bg-black px-3 py-2 text-white" onClick={onSave}>Save</button>
        </div>
      </header>

      {/* 이하 동일 (리스트/에디터/검증결과/메시지) */}
    </div>
  );
}
