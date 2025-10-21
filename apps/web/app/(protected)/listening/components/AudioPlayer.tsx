'use client';

type Props = { src: string };

function guessMime(src: string): string | undefined {
  const lower = src.split('?')[0].toLowerCase();
  if (lower.endsWith('.mp3')) return 'audio/mpeg';
  if (lower.endsWith('.ogg') || lower.endsWith('.oga')) return 'audio/ogg';
  if (lower.endsWith('.wav')) return 'audio/wav';
  return undefined;
}

export default function AudioPlayer({ src }: Props) {
  if (!src) {
    return (
      <div className="rounded border p-3 text-sm text-red-600">
        ?¬ìƒ???¤ë””??ì£¼ì†Œê°€ ?†ìŠµ?ˆë‹¤.
      </div>
    );
  }

  const mime = guessMime(src);

  return (
    <div className="rounded border p-3">
      <audio controls className="w-full" preload="metadata" aria-label="?¤ë””???Œë ˆ?´ì–´">
        <source src={src} type={mime} />
        ë¸Œë¼?°ì?ê°€ ?¤ë””???”ì†Œë¥?ì§€?í•˜ì§€ ?ŠìŠµ?ˆë‹¤.
      </audio>
      <p className="mt-2 text-xs text-gray-500">
        ?¤ë””?¤ê? ?¬ìƒ?˜ì? ?Šìœ¼ë©??ˆë¡œê³ ì¹¨ ???¤ì‹œ ?œë„??ì£¼ì„¸??ë¸Œë¼?°ì? ?ë™?¬ìƒ ?•ì±…???í–¥?????ˆì–´??.
      </p>
    </div>
  );
}
