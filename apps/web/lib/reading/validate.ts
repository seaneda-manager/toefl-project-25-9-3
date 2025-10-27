// apps/web/lib/reading/validate.ts
import type { RSet, RQuestion } from '@/models/reading/zod'; // 野껋럥以????????뵬

/** ??됱읈??RegExp escape */
function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** 筌롫?? ?됯퀣堉? ?袁⑹뒄????뺥닏筌롫??筌???됱읈??띿쓺 ?곗눖沅??븍┛ */
function viewMeta(q: RQuestion) {
  const summary = (q.meta?.summary ?? {}) as {
    candidates?: string[];
    correct?: number[];        // 0-based index list
    selectionCount?: number;   // required selection count
  };
  const insertion = (q.meta?.insertion ?? {}) as {
    anchors?: Array<string | number>; // explicit anchor list -> choices length?? ??덉뵬??곷튊 ??
    correctIndex?: number;
    /** 癰귣챶揆??筌욊낯??筌띾뜆鍮긺몴?獄쏅벡釉??怨뺣뮉 野껋럩?????????용뮞??(?? '[[INS]]' ?癒?뮉 '[#]') */
    marker?: string;
  };
  const pronoun = (q.meta?.pronoun_ref ?? {}) as {
    pronoun?: string;
    referents?: string[];      // ?袁⑤궖 筌ㅼ뮇??2揶?
    correctIndex?: number;
  };
  const paragraphHighlight = (q.meta?.paragraph_highlight ?? {}) as {
    paragraphs?: number[];
  };
  return { summary, insertion, pronoun, paragraphHighlight };
}

/** passage.content ??됰퓠????뚯뿯 筌띾뜆鍮?揶쏆뮇???硫몃┛ */
function countInsertionMarkers(content: string, marker: string) {
  if (!marker) return 0;
  const re = new RegExp(escapeRegExp(marker), 'g');
  return (content.match(re) || []).length;
}

/** ?怨?????以???醫뤿뼢: 揶쏆빘猿?紐? ?類ㅼ뵥 */
function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** ?얜챷???紐낅뱜 野꺜筌?*/
export function validateSet(s: RSet) {
  const errs: string[] = [];

  if (!s.passages?.length) errs.push('No passages.');

  s.passages?.forEach((p, pi) => {
    if (!p.title) errs.push(`P${pi + 1}: title missing`);
    if (!p.content) errs.push(`P${pi + 1}: content missing`);

    const seenNumbers = new Set<number>();

    (p.questions ?? []).forEach((q) => {
      // 甕곕뜇??餓λ쵎??
      if (seenNumbers.has(q.number)) errs.push(`P${pi + 1} Q# dup: ${q.number}`);
      seenNumbers.add(q.number);

      const choices = q.choices ?? [];
      const { summary, insertion, pronoun } = viewMeta(q);

      // ??μ뵬 ?類ｋ뼗 ?醫륁굨: summary/organization ??뽰뇚??랁??類μ넇??1揶??類ｋ뼗
      if (q.type !== 'summary' && q.type !== 'organization') {
        const corrects = choices.filter((c) => !!c.is_correct).length;
        if (corrects !== 1) {
          errs.push(`P${pi + 1} Q${q.number}: single-answer must have exactly 1 correct`);
        }
      }

      // insertion: anchors 獄쏄퀣肉????됱몵筌?疫뀀챷??=== choices.length
      // ??곸몵筌?癰귣챶揆????덈뮉 marker ??용뮞??揶쏆뮇??? choices.length ??깊뒄 野꺜??
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
          // 疫꿸퀡??筌띾뜆鍮??'[[INS]]'嚥?揶쎛??(?袁⑥쨮??븍뱜?癒?퐣 ?怨뺣뮉 揶쏅??앮에?獄쏅떽?????
          const markerText = insertion.marker ?? '[[INS]]';
          const markerCount = countInsertionMarkers(p.content || '', markerText);
          if (markerCount !== choiceCount) {
            errs.push(
              `P${pi + 1} Q${q.number}: insertion markers(${markerCount}) != choices(${choiceCount}) [marker="${markerText}"]`
            );
          }
        }
      }

      // summary: selectionCount & correct 揶쏆뮇?? ?醫뤾문筌왖 ??野꺜??
      if (q.type === 'summary') {
        const sel = Number.isFinite(summary.selectionCount)
          ? (summary.selectionCount as number)
          : 3;

        // 筌뤿굞???correct 獄쏄퀣肉????됱몵筌?域?疫뀀챷?? ??곸몵筌?choices??is_correct 揶쏆뮇??????
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

      // pronoun_ref: ????????놁뵬 ???춸 sanity 筌ｋ똾寃?
      if (q.type === 'pronoun_ref') {
        const refLen = pronoun.referents?.length ?? 0;
        if (refLen < 2) {
          errs.push(`P${pi + 1} Q${q.number}: pronoun_ref needs at least 2 referents`);
        }
        if (typeof pronoun.correctIndex === 'number' && pronoun.correctIndex >= refLen) {
          errs.push(`P${pi + 1} Q${q.number}: pronoun_ref correctIndex out of range`);
        }
      }

      // explanation.why_others(癰귣떯由계퉪???삳뼗???) ??? ??쇱젫 choice id?? 筌띲끉臾??롫뮉筌왖
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




