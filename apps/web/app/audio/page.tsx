'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

type FileRow = {
  name: string;
  id?: string;
  updated_at?: string;
  metadata?: Record<string, unknown> | null;
};

export default function Page() {
  const [items, setItems] = useState<FileRow[]>([]);
  const [msg, setMsg] = useState('loading...');
  const [busy, setBusy] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const urlFor = useCallback(
    (name: string) => supabase.storage.from('audio').getPublicUrl(name).data.publicUrl,
    []
  );

  const load = useCallback(async () => {
    setMsg('loading...');
    const { data, error } = await supabase.storage.from('audio').list('', {
      limit: 100,
      sortBy: { column: 'updated_at', order: 'desc' },
    });
    if (error) {
      setMsg(error.message);
      return;
    }
    setItems(data ?? []);
    setMsg('');
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const upload = useCallback(
    async (file: File) => {
      setBusy(true);
      try {
        const path = `uploads/${Date.now()}-${file.name}`;
        const { error } = await supabase.storage.from('audio').upload(path, file);
        if (error) {
          alert(error.message);
          return;
        }
        await load();
      } finally {
        setBusy(false);
      }
    },
    [load]
  );

  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) void upload(f);
    },
    [upload]
  );

  const onSelect = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const src = e.target.value;
    const el = audioRef.current;
    if (!el) return;
    el.src = src;
    el.load();
    void el.play().catch(() => {});
  }, []);

  return (
    <div
      style={{
        maxWidth: 900,
        margin: '24px auto',
        padding: 16,
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: 12,
      }}
    >
      <h2>Audio Storage</h2>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input type="file" accept="audio/*" onChange={onFileChange} />
        {busy && <span>Uploading...</span>}
      </div>

      {msg && <div style={{ marginTop: 8 }}>{msg}</div>}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 280px',
          gap: 12,
          marginTop: 12,
        }}
      >
        <ul style={{ margin: 0, paddingLeft: 16 }}>
          {items.map((it) => (
            <li key={it.name} style={{ marginBottom: 8 }}>
              <a href={urlFor(it.name)} target="_blank" rel="noreferrer">
                {it.name}
              </a>
            </li>
          ))}
        </ul>

        <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 8 }}>
          <div style={{ fontSize: 12, color: '#666' }}>
            {/* ?덈궡臾?紐⑥?諛붿? ?뺣━ */}
            怨듦컻 踰꾪궥(audio) ?ъ슜 湲곗??낅땲?? 鍮꾧났媛?RLS 踰꾪궥?대㈃ 沅뚰븳???놁쓣 ??
            {` 'permission denied'`}媛 ?쒖떆?????덉뼱??
          </div>

          <select onChange={onSelect} style={{ marginTop: 6, width: '100%' }}>
            <option value="">{`-- ?뚯씪 ?좏깮 --`}</option>
            {items
              .filter((it) => /\.(mp3|wav|m4a|ogg)$/i.test(it.name))
              .map((it) => (
                <option key={it.name} value={urlFor(it.name)}>
                  {it.name}
                </option>
              ))}
          </select>

          <audio ref={audioRef} id="aud" controls style={{ width: '100%', marginTop: 8 }} />
          <div style={{ marginTop: 8, fontSize: 12, color: '#6b7280' }}>
            ?ъ깮? 怨듦컻 URL 湲곕컲?낅땲?? ?щ궡留?沅뚰븳 ?ㅼ젙???곕씪 ?묎렐???쒗븳?????덉뒿?덈떎.
          </div>
        </div>
      </div>
    </div>
  );
}





