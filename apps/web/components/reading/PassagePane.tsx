'use client';
import { targetFromMeta } from './metaAdapter';

export default function PassagePane({ content, q }: { content: string; q: any }) {
  const target = targetFromMeta(q);
  const paragraphs = content.split(/\n{2,}/g).map(s => s.trim()).filter(Boolean);

  return (
    <div className="prose max-w-none h-full overflow-y-auto pr-4">
      {paragraphs.map((p, i) => {
        const isTarget = target?.mode === 'paragraph' && target.paragraph_index === i;
        return (
          <div key={i} className="relative my-4">
            {isTarget && (target as any)?.arrow && (
              <div className="absolute -left-6 top-1">➤</div>
            )}
            <span className={isTarget ? 'bg-yellow-200/60 dark:bg-sky-900/50' : ''}>{p}</span>

            {target?.mode === 'insertion' && i === (target as any).paragraph_index && (
              <div className="mt-2 flex gap-2">
                {(target as any).anchors.map((a: string) => (
                  <span key={a} className="inline-block border px-2 py-1 text-sm">■ {a}</span>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
