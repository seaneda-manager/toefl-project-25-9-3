// apps/web/app/(protected)/reading/study/ReadingStudyRunner.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import ReadingLayout from '@/components/reading/ReadingLayout';
import SummaryCard from '@/components/test/SummaryCard';
// InsertionMarkers??吏臾????몃씪??留덉빱濡??泥댄븯???ъ슜?섏? ?딆뒿?덈떎.
// import InsertionMarkers from '@/components/test/InsertionMarkers';
import { startSession, submitAnswer, finishSession } from '@/lib/sessionClient';

export type RChoice = { id: string; text: string; is_correct?: boolean };
export type RQuestion = {
  id: string;
  number: number;
  type:
    | 'vocab'
    | 'detail'
    | 'negative_detail'
    | 'paraphrasing'
    | 'insertion'
    | 'inference'
    | 'purpose'
    | 'pronoun_ref'
    | 'summary'
    | 'organization';
  stem: string;
  choices: RChoice[];
  meta?: any; // insertionAnchors?: number[]; summary?: { maxSelect: number }; paragraphIndex?: number
};
export type RPassage = {
  id: string;
  title: string;
  content: string;
  questions: RQuestion[];
};

function ReadingStudyRunner({
  passage,
  mode = 'study',
  onFinish,
}: {
  passage: RPassage;
  mode?: 'study' | 'exam' | 'review';
  onFinish?: (sessionId: string) => void;
}) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [idx, setIdx] = useState(0);
  const [ans, setAns] = useState<Record<string, string>>({});
  const [summarySel, setSummarySel] = useState<Record<string, string[]>>({});
  const [viewTextOnly, setViewTextOnly] = useState(false); // Summary ?꾩슜 ?좉?

  const total = passage.questions.length;
  const q = passage.questions[idx];

  const isSummary = q?.type === 'summary';
  const isInsertion = q?.type === 'insertion';
  const maxSummary = q?.meta?.summary?.maxSelect ?? 3;

  // ?몄뀡 ?쒖옉
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { sessionId } = await startSession({ section: 'reading', mode });
      if (mounted) setSessionId(sessionId);
    })();
    return () => {
      mounted = false;
    };
  }, [mode]);

  // 吏臾?臾몃떒 遺꾪빐(鍮?以?湲곗?)
  const paragraphs = useMemo(
    () => passage.content.split(/\n\s*\n/),
    [passage.content]
  );

  // ?⑥씪 ?좏깮 湲곕줉
  const pickChoice = async (qid: string, cid: string) => {
    setAns((s) => ({ ...s, [qid]: cid }));
    if (sessionId) {
      await submitAnswer({ sessionId, questionId: qid, choiceId: cid });
    }
  };

  // ?붾툝?대┃ ?몃몢(?⑥씪 ?좏깮 ?댁젣)
  const undoChoice = async (qid: string) => {
    setAns((s) => {
      const copy = { ...s };
      delete copy[qid];
      return copy;
    });
    if (sessionId) {
      // ?쒕쾭??'?몃몢' ?뚰듃瑜??④린怨??띕떎硫?meta濡??쒖떆 (諛깆뿏?쒓? 臾댁떆?대룄 臾댄빐)
      await submitAnswer({ sessionId, questionId: qid, choiceId: '', meta: { undo: true } });
    }
  };

  // ?쎌엯 ?꾩튂 ?좏깮
  const pickInsertion = async (label: 'A' | 'B' | 'C' | 'D') => {
    await pickChoice(q.id, `INS-${label}`);
  };

  // Summary ?좏깮(移댁슫???쒗븳)
  const onSummaryChange = async (nextIds: string[]) => {
    const prev = summarySel[q.id] ?? [];
    // 1) 媛쒖닔 ?쒗븳: ?덈줈 異붽?濡??명빐 max瑜?珥덇낵?섎㈃ 臾댁떆(?몃몢/?좉?? ?덉슜)
    if (nextIds.length > maxSummary && nextIds.length > prev.length) {
      return; // 珥덇낵 ?좏깮 臾댁떆
    }
    setSummarySel((m) => ({ ...m, [q.id]: nextIds }));
    if (sessionId) {
      await submitAnswer({
        sessionId,
        questionId: q.id,
        choiceId: nextIds.join(','),
        meta: { multi: true, max: maxSummary, count: nextIds.length },
      });
    }
  };

  const finish = async () => {
    if (!sessionId) return;
    await finishSession({ sessionId });
    onFinish?.(sessionId);
  };

  const goPrev = () => setIdx((i) => Math.max(0, i - 1));
  const goNext = () => setIdx((i) => Math.min(total - 1, i + 1));

  // Summary???뺥솗??maxSelect媛??좏깮?댁빞 吏꾪뻾 媛??/ ?섎㉧吏??1媛??댁긽 ?좏깮 ?꾩슂
  const readyForThisQ = isSummary
    ? (summarySel[q.id]?.length ?? 0) === maxSummary
    : Boolean(ans[q.id]);

  // ====== 醫뚯륫 ?⑤꼸 ======
  const radioName = `q-${q?.id ?? 'na'}`;

  const choicePanel: React.ReactNode = isSummary ? (
    <div className="space-y-3">
      {/* 移댁슫??諛곗? */}
      <div className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium">
        Select {(summarySel[q.id]?.length ?? 0)} / {maxSummary}
      </div>
      <SummaryCard
        maxSelect={maxSummary}
        choices={q.choices.map(({ id, text }: RChoice) => ({ id, text }))}
        selectedIds={summarySel[q.id] ?? []}
        onChange={onSummaryChange}
      />
    </div>
  ) : isInsertion ? (
    <div role="radiogroup" aria-labelledby={`legend-${q.id}`} className="space-y-2">
      {q.choices.map((c: RChoice) => {
        const checked = ans[q.id] === c.id;
        return (
          <label
            key={c.id}
            className="flex items-start gap-3 select-none rounded-xl bg-white px-3 py-2 hover:bg-gray-50 cursor-pointer"
            onDoubleClick={(e) => {
              e.preventDefault();
              if (checked) undoChoice(q.id);
            }}
          >
            <input
              type="radio"
              name={radioName}
              className="mt-1 h-4 w-4 accent-[#0B1F3A] [appearance:auto]"
              checked={checked}
              onChange={() => pickChoice(q.id, c.id)}
            />
            <span className="leading-relaxed">{c.text}</span>
          </label>
        );
      })}
    </div>
  ) : (
    <div role="radiogroup" aria-labelledby={`legend-${q.id}`} className="space-y-2">
      {q.choices.map((c: RChoice) => {
        const checked = ans[q.id] === c.id;
        return (
          <label
            key={c.id}
            className="flex items-start gap-3 select-none rounded-xl bg-white px-3 py-2 hover:bg-gray-50 cursor-pointer"
            onDoubleClick={(e) => {
              e.preventDefault();
              if (checked) undoChoice(q.id);
            }}
          >
            <input
              type="radio"
              name={radioName}
              className="mt-1 h-4 w-4 accent-[#0B1F3A] [appearance:auto]"
              checked={checked}
              onChange={() => pickChoice(q.id, c.id)}
            />
            <span className="leading-relaxed">{c.text}</span>
          </label>
        );
      })}
    </div>
  );

  // ====== ?쎌엯 留덉빱: 臾몃떒 ?ㅼ뿉 [A][B][C][D] 踰꾪듉 ?쎌엯 ======
  const insertionMarkersByParagraph = useMemo(() => {
    if (!isInsertion) return {};
    const anchors: number[] = (q.meta?.insertionAnchors ?? [0, 1, 2, 3]).slice(0, 4);
    const labels = ['A', 'B', 'C', 'D'] as const;
    const map: Record<number, 'A' | 'B' | 'C' | 'D'> = {};
    anchors.forEach((pi, i) => {
      map[pi] = labels[i];
    });
    return map;
  }, [isInsertion, q]);

  // ?곗륫 吏臾?(?쎌엯?뺤씠硫?留덉빱 異붽?)
  const passageView = (
    <div className="space-y-4">
      {paragraphs.map((p: string, i: number) => {
        const afterMarker = isInsertion && (i in insertionMarkersByParagraph);
        const picked = ans[q.id]?.replace('INS-', '') as 'A' | 'B' | 'C' | 'D' | undefined;
        const thisLabel = afterMarker ? insertionMarkersByParagraph[i] : undefined;

        return (
          <div key={i} className="space-y-2">
            <p className="leading-relaxed">{p}</p>

            {afterMarker && thisLabel && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => pickInsertion(thisLabel)}
                  onDoubleClick={(e) => {
                    e.preventDefault();
                    if (picked === thisLabel) undoChoice(q.id);
                  }}
                  className={[
                    'inline-flex items-center rounded-md border px-2 py-1 text-sm',
                    'hover:bg-gray-50',
                    picked === thisLabel
                      ? 'border-[#0B1F3A] bg-[#0B1F3A]/10 font-semibold'
                      : 'border-gray-300 bg-white',
                  ].join(' ')}
                  aria-pressed={picked === thisLabel}
                  aria-label={`Insert at ${thisLabel}`}
                  title={`Insert at ${thisLabel}`}
                >
                  [{thisLabel}]
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  // Summary ?꾩슜: View Text / View Question ?좉?
  const viewTextLabel = isSummary ? (viewTextOnly ? 'View Question' : 'View Text') : 'View Text';
  const oneColumn = isSummary && viewTextOnly;

  return (
    <ReadingLayout
      title={passage.title}
      questionNo={`Q${q.number} / ${total}`}
      stem={q.stem}
      passage={passageView}
      leftPanel={oneColumn ? null : choicePanel}
      onBack={goPrev}
      onNext={goNext}
      onFinish={finish}
      onViewText={isSummary ? () => setViewTextOnly((v) => !v) : undefined}
      viewTextLabel={viewTextLabel}
      canBack={idx > 0}
      canNext={readyForThisQ}
      isLast={idx === total - 1}
      oneColumn={oneColumn}
    />
  );
}

export default ReadingStudyRunner;

