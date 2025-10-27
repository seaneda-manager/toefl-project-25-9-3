// apps/web/app/(protected)/admin/_components/SetForm.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { ContentSet, ContentSetInput } from '@/app/types/types-cms';

type Props = {
  initial?: Partial<ContentSet>;
  id?: string;
};

/** ???곹깭 ????붿떆??any 諛⑹?) */
type SetFormState = {
  title: string;
  section: ContentSet['section'];
  level: string;
  tags: string[];
  description: string;
  is_published: boolean;
};

export default function SetForm({ initial, id }: Props) {
  const router = useRouter();

  const [form, setForm] = useState<SetFormState>({
    title: initial?.title ?? '',
    section: (initial?.section as ContentSet['section']) ?? 'reading',
    level: initial?.level ?? '',
    tags: initial?.tags ?? [],
    description: initial?.description ?? '',
    is_published: initial?.is_published ?? false,
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(id ? `/api/admin/sets/${id}` : '/api/admin/sets', {
        method: id ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form as ContentSetInput),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'failed');
      router.push('/(protected)/admin/sets');
      router.refresh();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4 max-w-2xl">
      {err && <div className="text-red-600 text-sm">{err}</div>}

      <div>
        <label htmlFor="title" className="block text-sm mb-1">Title</label>
        <input
          id="title"
          className="w-full border rounded-lg px-3 py-2"
          value={form.title}
          onChange={(e) =>
            setForm((f: SetFormState) => ({ ...f, title: e.target.value }))
          }
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="section" className="block text-sm mb-1">Section</label>
          <select
            id="section"
            className="w-full border rounded-lg px-3 py-2"
            value={form.section}
            onChange={(e) =>
              setForm((f: SetFormState) => ({
                ...f,
                section: e.target.value as ContentSet['section'],
              }))
            }
          >
            <option value="reading">Reading</option>
            <option value="listening">Listening</option>
            <option value="speaking">Speaking</option>
            <option value="writing">Writing</option>
          </select>
        </div>

        <div>
          <label htmlFor="level" className="block text-sm mb-1">Level (?듭뀡)</label>
          <input
            id="level"
            className="w-full border rounded-lg px-3 py-2"
            placeholder="?? 珥?以?怨? A2/B1 ??
            value={form.level ?? ''}
            onChange={(e) =>
              setForm((f: SetFormState) => ({ ...f, level: e.target.value }))
            }
          />
        </div>
      </div>

      <div>
        <label htmlFor="tags" className="block text-sm mb-1">Tags (?쇳몴 援щ텇)</label>
        <input
          id="tags"
          className="w-full border rounded-lg px-3 py-2"
          value={(form.tags ?? []).join(', ')}
          onChange={(e) => {
            const t = e.target.value
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean);
            setForm((f: SetFormState) => ({ ...f, tags: t }));
          }}
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm mb-1">Description</label>
        <textarea
          id="description"
          className="w-full border rounded-lg px-3 py-2 min-h-[100px]"
          value={form.description ?? ''}
          onChange={(e) =>
            setForm((f: SetFormState) => ({ ...f, description: e.target.value }))
          }
        />
      </div>

      <label className="inline-flex items-center gap-2">
        <input
          type="checkbox"
          checked={!!form.is_published}
          onChange={(e) =>
            setForm((f: SetFormState) => ({ ...f, is_published: e.target.checked }))
          }
        />
      </label>
      <span className="text-sm">Published</span>

      <div className="pt-2">
        <button
          type="submit"
          disabled={busy}
          className="px-4 py-2 rounded-xl bg-blue-600 text-white disabled:opacity-60"
        >
          {busy ? (id ? 'Updating?? : 'Creating??) : id ? 'Update Set' : 'Create Set'}
        </button>
      </div>
    </form>
  );
}


