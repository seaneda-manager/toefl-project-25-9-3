import type { RQuestion } from '@/types/types-reading';

export type Target =
  | { mode: 'paragraph'; paragraph_index: number; arrow?: boolean }
  | { mode: 'insertion'; paragraph_index: number; anchors: string[] }
  | undefined;

export function targetFromMeta(q: RQuestion): Target {
  const m = q.meta;
  if (!m) return undefined;
  if (m.paragraph_highlight?.paragraphs?.length) {
    return { mode: 'paragraph', paragraph_index: m.paragraph_highlight.paragraphs[0], arrow: true };
  }
  if (m.insertion?.anchors?.length) {
    return { mode: 'insertion', paragraph_index: 0, anchors: m.insertion.anchors };
  }
  return undefined;
}
