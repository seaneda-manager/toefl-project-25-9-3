// apps/web/components/reading/metaAdapter.ts
import type { RQuestion } from '@/types/types-reading';

export type Target =
  | { mode: 'paragraph'; paragraph_index: number; arrow?: boolean }
  | { mode: 'insertion'; paragraph_index: number; anchors: string[] }
  | undefined;

// QLike/얇은 질문 객체도 허용하기 위한 캐리어 타입
export type MetaCarrier = {
  type?: string;
  meta?: unknown;
};

// 내부 파싱에서 사용할 안전한 보조 타입
type ParagraphHighlightMeta = { paragraphs?: number[] } | undefined;
type InsertionMeta = { anchors?: Array<string | number> } | undefined;

/** meta 안전 파서 */
function viewMeta(q: MetaCarrier | RQuestion) {
  const meta = (q as any)?.meta ?? {};
  const paragraphHighlight = (meta?.paragraph_highlight ?? {}) as ParagraphHighlightMeta;
  const insertion = (meta?.insertion ?? {}) as InsertionMeta;
  return { paragraphHighlight, insertion };
}

/** ──────────────────────────────────────────────────────────
 *  오버로드: RQuestion도, MetaCarrier(QLike)도 모두 받는다
 *  ────────────────────────────────────────────────────────── */
export function targetFromMeta(q: RQuestion): Target;
export function targetFromMeta(q: MetaCarrier): Target;
export function targetFromMeta(q: any): Target {
  const { paragraphHighlight, insertion } = viewMeta(q);

  // 문단 하이라이트
  if (paragraphHighlight?.paragraphs?.length) {
    const idxRaw = paragraphHighlight.paragraphs[0];
    const paragraph_index =
      Number.isFinite(idxRaw) && (idxRaw as number) >= 0 ? (idxRaw as number) : 0;
    return { mode: 'paragraph', paragraph_index, arrow: true };
  }

  // 문장 삽입
  if (insertion?.anchors?.length) {
    const anchors = insertion.anchors.map(String);
    // 보통 본문 전체 기준(0)에서 앵커 목록 사용
    return { mode: 'insertion', paragraph_index: 0, anchors };
  }

  return undefined;
}
