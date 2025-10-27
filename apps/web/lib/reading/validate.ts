// apps/web/lib/reading/validate.ts
import type { RSet, RQuestion } from '@/models/reading/zod'; // 寃쎈줈/????듭씪

/** ?덉쟾??RegExp escape */
function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** 硫뷀? 酉곗뼱: ?꾩슂???쒕툕硫뷀?留??덉쟾?섍쾶 爰쇰궡?ㅺ린 */
function viewMeta(q: RQuestion) {
  const summary = (q.meta?.summary ?? {}) as {
    candidates?: string[];
    correct?: number[];        // 0-based index list
    selectionCount?: number;   // required selection count
  };
  const insertion = (q.meta?.insertion ?? {}) as {
    anchors?: Array<string | number>; // explicit anchor list -> choices length? ?숈씪?댁빞 ??
    correctIndex?: number;
    /** 蹂몃Ц??吏곸젒 留덉빱瑜?諛뺤븘 ?곕뒗 寃쎌슦 ?ъ슜???띿뒪??(?? '[[INS]]' ?먮뒗 '[#]') */
    marker?: string;
  };
  const pronoun = (q.meta?.pronoun_ref ?? {}) as {
    pronoun?: string;
    referents?: string[];      // ?꾨낫 理쒖냼 2媛?
    correctIndex?: number;
  };
  const paragraphHighlight = (q.meta?.paragraph_highlight ?? {}) as {
    paragraphs?: number[];
  };
  return { summary, insertion, pronoun, paragraphHighlight };
}

/** passage.content ?덉뿉???쎌엯 留덉빱 媛쒖닔 ?멸린 */
function countInsertionMarkers(content: string, marker: string) {
  if (!marker) return 0;
  const re = new RegExp(escapeRegExp(marker), 'g');
  return (content.match(re) || []).length;
}

/** ?고????대줈???좏떥: 媛앹껜?몄? ?뺤씤 */
function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** 臾몄젣 ?명듃 寃利?*/
export function validateSet(s: RSet) {
  const errs: string[] = [];

  if (!s.passages?.length) errs.push('No passages.');

  s.passages?.forEach((p, pi) => {
    if (!p.title) errs.push(`P${pi + 1}: title missing`);
    if (!p.content) errs.push(`P${pi + 1}: content missing`);

    const seenNumbers = new Set<number>();

    (p.questions ?? []).forEach((q) => {
      // 踰덊샇 以묐났
      if (seenNumbers.has(q.number)) errs.push(`P${pi + 1} Q# dup: ${q.number}`);
      seenNumbers.add(q.number);

      const choices = q.choices ?? [];
      const { summary, insertion, pronoun } = viewMeta(q);

      // ?⑥씪 ?뺣떟 ?좏삎: summary/organization ?쒖쇅?섍퀬 ?뺥솗??1媛??뺣떟
      if (q.type !== 'summary' && q.type !== 'organization') {
        const corrects = choices.filter((c) => !!c.is_correct).length;
        if (corrects !== 1) {
          errs.push(`P${pi + 1} Q${q.number}: single-answer must have exactly 1 correct`);
        }
      }

      // insertion: anchors 諛곗뿴???덉쑝硫?湲몄씠 === choices.length
      // ?놁쑝硫?蹂몃Ц???덈뒗 marker ?띿뒪??媛쒖닔? choices.length ?쇱튂 寃??
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
          // 湲곕낯 留덉빱??'[[INS]]'濡?媛??(?꾨줈?앺듃?먯꽌 ?곕뒗 媛믪쑝濡?諛붽퓭????
          const markerText = insertion.marker ?? '[[INS]]';
          const markerCount = countInsertionMarkers(p.content || '', markerText);
          if (markerCount !== choiceCount) {
            errs.push(
              `P${pi + 1} Q${q.number}: insertion markers(${markerCount}) != choices(${choiceCount}) [marker="${markerText}"]`
            );
          }
        }
      }

      // summary: selectionCount & correct 媛쒖닔, ?좏깮吏 ??寃??
      if (q.type === 'summary') {
        const sel = Number.isFinite(summary.selectionCount)
          ? (summary.selectionCount as number)
          : 3;

        // 紐낆떆??correct 諛곗뿴???덉쑝硫?洹?湲몄씠, ?놁쑝硫?choices??is_correct 媛쒖닔 ?ъ슜
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

      // pronoun_ref: ?대떦 ??낆씪 ?뚮쭔 sanity 泥댄겕
      if (q.type === 'pronoun_ref') {
        const refLen = pronoun.referents?.length ?? 0;
        if (refLen < 2) {
          errs.push(`P${pi + 1} Q${q.number}: pronoun_ref needs at least 2 referents`);
        }
        if (typeof pronoun.correctIndex === 'number' && pronoun.correctIndex >= refLen) {
          errs.push(`P${pi + 1} Q${q.number}: pronoun_ref correctIndex out of range`);
        }
      }

      // explanation.why_others(蹂닿린蹂??ㅻ떟?ъ쑀) ?ㅺ? ?ㅼ젣 choice id? 留ㅼ묶?섎뒗吏
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


