'use client';

import ReadingStudyRunner, {
  type RPassage,
  type RQuestion,
} from '@/app/(protected)/reading/study/ReadingStudyRunner';

// 援ы삎 ?곗씠?곗쓽 ?ㅼ뼇???ㅻ? ?섏슜?섎뒗 ?대뙌??
function normalizePassage(data: any): RPassage {
  const title =
    data?.title ??
    data?.passage?.title ??
    data?.passageTitle ??
    'Untitled Passage';

  const content =
    data?.content ??
    data?.passage ??
    data?.body ??
    data?.text ??
    '';

  const items: any[] =
    data?.questions ??
    data?.items ??
    data?.qs ??
    data?.problems ??
    [];

  const mapType = (t?: string): RQuestion['type'] => {
    const s = String(t || '').toLowerCase();
    if (s.includes('summary')) return 'summary';
    if (s.includes('insert')) return 'insertion';
    if (s.includes('vocab')) return 'vocab';
    if (s.includes('negative') || s.includes('except')) return 'negative_detail';
    if (s.includes('inference') || s.includes('infer')) return 'inference';
    if (s.includes('purpose')) return 'purpose';
    if (s.includes('pronoun')) return 'pronoun_ref';
    if (s.includes('organ')) return 'organization';
    if (s.includes('paraphr')) return 'paraphrasing';
    if (s.includes('detail')) return 'detail';
    return 'detail';
  };

  const questions: RQuestion[] = items.map((q, i) => {
    const id = String(q?.id ?? i + 1);
    const choices =
      q?.choices ??
      q?.options ??
      q?.answers ??
      [];
    const choiceList = choices.map((c: any, ci: number) => ({
      id: String(c?.id ?? `${id}-${ci}`),
      text: String(c?.text ?? c?.label ?? c ?? ''),
    }));

    const meta: any = {};
    const pidx = q?.paragraphIndex ?? q?.paraIndex ?? q?.para ?? undefined;
    if (typeof pidx === 'number') meta.paragraphIndex = pidx;

    const anchors =
      q?.insertionAnchors ??
      q?.anchors ??
      q?.insertAnchors ??
      undefined;
    if (Array.isArray(anchors)) meta.insertionAnchors = anchors;

    const maxSelect = q?.maxSelect ?? q?.summary?.maxSelect;
    if (maxSelect) meta.summary = { maxSelect: Number(maxSelect) };

    return {
      id,
      number: Number(q?.number ?? i + 1),
      type: mapType(q?.type),
      stem: String(q?.stem ?? q?.prompt ?? q?.question ?? ''),
      choices: choiceList,
      meta,
    };
  });

  return { id: String(data?.id ?? 'legacy'), title, content, questions };
}

export default function ReadingRunnerBridge({
  data,
  mode = 'study',
  onFinish,
}: {
  data: any; // 湲곗〈 ?섏씠吏媛 ?곕뜕 ?곗씠??洹몃?濡??섍꺼以섎룄 ??
  mode?: 'study' | 'exam' | 'review';
  onFinish?: (sid: string) => void;
}) {
  const passage = normalizePassage(data);
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <ReadingStudyRunner passage={passage} mode={mode} onFinish={onFinish} />
    </div>
  );
}

