// apps/web/lib/reading/validate.ts
import type { RSet, RQuestion } from '@/lib/readingSchemas'; // 경로/타입 통일

/** 안전한 RegExp escape */
function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** 메타 뷰어: 필요한 서브메타만 안전하게 꺼내오기 */
function viewMeta(q: RQuestion) {
  const summary = (q.meta?.summary ?? {}) as {
    candidates?: string[];
    correct?: number[];        // 0-based index list
    selectionCount?: number;   // required selection count
  };
  const insertion = (q.meta?.insertion ?? {}) as {
    anchors?: Array<string | number>; // explicit anchor list -> choices length와 동일해야 함
    correctIndex?: number;
    /** 본문에 직접 마커를 박아 쓰는 경우 사용할 텍스트 (예: '[[INS]]' 또는 '[#]') */
    marker?: string;
  };
  const pronoun = (q.meta?.pronoun_ref ?? {}) as {
    pronoun?: string;
    referents?: string[];      // 후보 최소 2개
    correctIndex?: number;
  };
  const paragraphHighlight = (q.meta?.paragraph_highlight ?? {}) as {
    paragraphs?: number[];
  };
  return { summary, insertion, pronoun, paragraphHighlight };
}

/** passage.content 안에서 삽입 마커 개수 세기 */
function countInsertionMarkers(content: string, marker: string) {
  if (!marker) return 0;
  const re = new RegExp(escapeRegExp(marker), 'g');
  return (content.match(re) || []).length;
}

/** 런타임 내로잉 유틸: 객체인지 확인 */
function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** 문제 세트 검증 */
export function validateSet(s: RSet) {
  const errs: string[] = [];

  if (!s.passages?.length) errs.push('No passages.');

  s.passages?.forEach((p, pi) => {
    if (!p.title) errs.push(`P${pi + 1}: title missing`);
    if (!p.content) errs.push(`P${pi + 1}: content missing`);

    const seenNumbers = new Set<number>();

    (p.questions ?? []).forEach((q) => {
      // 번호 중복
      if (seenNumbers.has(q.number)) errs.push(`P${pi + 1} Q# dup: ${q.number}`);
      seenNumbers.add(q.number);

      const choices = q.choices ?? [];
      const { summary, insertion, pronoun } = viewMeta(q);

      // 단일 정답 유형: summary/organization 제외하고 정확히 1개 정답
      if (q.type !== 'summary' && q.type !== 'organization') {
        const corrects = choices.filter((c) => !!c.is_correct).length;
        if (corrects !== 1) {
          errs.push(`P${pi + 1} Q${q.number}: single-answer must have exactly 1 correct`);
        }
      }

      // insertion: anchors 배열이 있으면 길이 === choices.length
      // 없으면 본문에 있는 marker 텍스트 개수와 choices.length 일치 검사
      if (q.type === 'insertion') {
        const choiceCount = choices.length;
        if (Array.isArray(insertion.anchors)) {
          const anchorCount = insertion.anchors.length;
          if (anchorCount !== choiceCount) {
            errs.push(
              `P${pi + 1} Q${q.number}: insertion anchors(${anchorCount}) != choices(${choiceCount})`
            );
          }
        } else {
          // 기본 마커는 '[[INS]]'로 가정 (프로젝트에서 쓰는 값으로 바꿔도 됨)
          const markerText = insertion.marker ?? '[[INS]]';
          const markerCount = countInsertionMarkers(p.content || '', markerText);
          if (markerCount !== choiceCount) {
            errs.push(
              `P${pi + 1} Q${q.number}: insertion markers(${markerCount}) != choices(${choiceCount}) [marker="${markerText}"]`
            );
          }
        }
      }

      // summary: selectionCount & correct 개수, 선택지 수 검사
      if (q.type === 'summary') {
        const sel = Number.isFinite(summary.selectionCount)
          ? (summary.selectionCount as number)
          : 3;

        // 명시된 correct 배열이 있으면 그 길이, 없으면 choices의 is_correct 개수 사용
        const correctCount = Array.isArray(summary.correct)
          ? summary.correct.length
          : choices.filter((c) => !!c.is_correct).length;

        if (correctCount !== sel) {
          errs.push(`P${pi + 1} Q${q.number}: summary correct must be ${sel}`);
        }
        if (choices.length < sel * 2) {
          errs.push(`P${pi + 1} Q${q.number}: summary needs >= ${sel * 2} choices`);
        }
      }

      // pronoun_ref: 해당 타입일 때만 sanity 체크
      if (q.type === 'pronoun_ref') {
        const refLen = pronoun.referents?.length ?? 0;
        if (refLen < 2) {
          errs.push(`P${pi + 1} Q${q.number}: pronoun_ref needs at least 2 referents`);
        }
        if (typeof pronoun.correctIndex === 'number' && pronoun.correctIndex >= refLen) {
          errs.push(`P${pi + 1} Q${q.number}: pronoun_ref correctIndex out of range`);
        }
      }

      // explanation.why_others(보기별 오답사유) 키가 실제 choice id와 매칭되는지
      {
        const exp = q.explanation as unknown;
        if (isObject(exp) && 'why_others' in exp) {
          const why = (exp as Record<string, unknown>)['why_others'];
          if (isObject(why)) {
            const ids = new Set(choices.map((c) => c.id));
            for (const id of Object.keys(why)) {
              if (!ids.has(id)) {
                errs.push(
                  `P${pi + 1} Q${q.number}: why_others has unknown choice id "${id}"`
                );
              }
            }
          }
        }
      }
    });
  });

  return errs;
}
