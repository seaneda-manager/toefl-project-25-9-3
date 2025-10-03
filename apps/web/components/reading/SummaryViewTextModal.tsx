'use client';
import { useEffect } from 'react';

export default function SummaryViewTextModal({
  open,
  onClose,
  content,
}: {
  open: boolean;
  onClose: () => void;
  content: string;
}) {
  if (!open) return null;
  const looksLikeHTML = /<[a-z][\s\S]*>/i.test(content);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute left-1/2 top-1/2 w-[min(900px,92vw)] max-h-[80vh] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white text-neutral-900 shadow-xl">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="font-semibold">View Text</div>
          <button className="rounded border px-3 py-1" onClick={onClose}>Close (Esc)</button>
        </div>
        <div className="p-4 overflow-auto" style={{ maxHeight: 'calc(80vh - 56px)' }}>
          {looksLikeHTML ? (
            <div dangerouslySetInnerHTML={{ __html: content }} />
          ) : (
            <pre className="whitespace-pre-wrap text-[16px] leading-7">{content}</pre>
          )}
        </div>
      </div>
    </div>
  );
}
