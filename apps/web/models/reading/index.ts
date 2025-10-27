// apps/web/models/reading/index.ts
import { z } from 'zod';
import {
    READING_QTYPES,
    qTypeEnum,
    readingChoiceSchema,
    readingMetaSchema,
    readingQuestionSchema,
    readingPassageSchema,
    readingSetSchema,
    type RChoice,
    type RQuestion,
    type RPassage,
    type RSet,
} from './zod';

/** -----------------------------
 *  Re-exports (SSOT)
 *  ----------------------------*/
export {
    // consts
    READING_QTYPES,
    qTypeEnum,
    // schemas
    readingChoiceSchema,
    readingMetaSchema,
    readingQuestionSchema,
    readingPassageSchema,
    readingSetSchema,
    // types
    type RChoice,
    type RQuestion,
    type RPassage,
    type RSet,
};

/** -----------------------------
 *  Helpers (공용)
 *  ----------------------------*/

/** 엄격 검증 + 타입 세이프 파싱 */
export function parseReadingSet(input: unknown): RSet {
    return readingSetSchema.parse(input);
}

/** Form/JSON 두 군데에서 문단 분할 로직 공유 (컴포넌트와 동일 규칙) */
export function splitParagraphs(
    content: string,
    mode: 'auto' | 'blankline' | 'html' = 'auto'
): string[] {
    if (!content) return [];
    if (mode === 'html') {
        return content
            .split(/<\/p>|<\/div>/i)
            .map((s) => s.replace(/<[^>]+>/g, '').trim())
            .filter(Boolean);
    }
    return content
        .split(/\n{2,}/g)
        .map((s) => s.trim())
        .filter(Boolean);
}

/** 메타 읽기 보조 (any-safe) */
export function metaView(q: RQuestion) {
    const m = (q.meta ?? {}) as any;
    return {
        summary: (m.summary ?? {}) as {
            candidates?: string[];
            correct?: number[];
            selectionCount?: number;
        },
        insertion: (m.insertion ?? {}) as {
            anchors?: (string | number)[];
            correctIndex?: number;
        },
        pronoun_ref: (m.pronoun_ref ?? {}) as {
            pronoun?: string;
            referents?: string[];
            correctIndex?: number;
        },
        paragraph_highlight: (m.paragraph_highlight ?? {}) as {
            paragraphs?: number[];
        },
    };
}

/** 린트 (컴포넌트의 lintReadingSet을 SSOT로 승격) */
export function lintReadingSet(set: RSet): Array<{ level: 'error' | 'warn'; where: string; msg: string }> {
    const issues: Array<{ level: 'error' | 'warn'; where: string; msg: string }> = [];
    const p0 = set.passages?.[0];
    if (!p0) {
        issues.push({ level: 'error', where: 'set.passages', msg: 'At least one passage is required.' });
        return issues;
    }
    const paras = Array.isArray(p0.paragraphs) ? p0.paragraphs : [];

    (p0.questions || []).forEach((q, qi) => {
        const where = `Q${q.number}(${q.type})`;
        const m = metaView(q);

        // 번호 연속성
        if (q.number !== qi + 1) {
            issues.push({
                level: 'warn',
                where,
                msg: `Question number mismatch. Expected ${qi + 1}, got ${q.number}.`,
            });
        }

        // 선택지
        if (!q.choices?.length) issues.push({ level: 'error', where, msg: 'No choices provided.' });
        q.choices?.forEach((c, ci) => {
            if (!c.text?.trim()) issues.push({ level: 'warn', where, msg: `Choice #${ci + 1} has empty text.` });
        });

        // 유형별 메타
        if (q.type === 'summary') {
            const cand = m.summary.candidates ?? [];
            const cor = m.summary.correct ?? [];
            const sel = Number.isFinite(m.summary.selectionCount) ? (m.summary.selectionCount as number) : NaN;

            if (cand.length === 0) issues.push({ level: 'error', where, msg: 'summary.candidates required.' });
            if (!Number.isFinite(sel) || sel < 1)
                issues.push({ level: 'error', where, msg: 'summary.selectionCount must be >= 1.' });
            if (cor.length !== sel)
                issues.push({
                    level: 'error',
                    where,
                    msg: `summary.correct length (${cor.length}) must equal selectionCount (${Number.isNaN(sel) ? 'NaN' : sel}).`,
                });
            if (cor.some((i: number) => i < 0 || i >= cand.length))
                issues.push({ level: 'error', where, msg: 'summary.correct index out of range.' });
        } else if (q.type === 'insertion') {
            const ins = m.insertion;
            const anchorsLen = ins.anchors?.length ?? 0;
            if (!anchorsLen) issues.push({ level: 'error', where, msg: 'insertion.anchors required.' });
            if (ins && (ins.correctIndex == null || ins.correctIndex < 0 || ins.correctIndex >= anchorsLen)) {
                issues.push({ level: 'error', where, msg: 'insertion.correctIndex out of range.' });
            }
        } else if (q.type === 'pronoun_ref') {
            const pr = m.pronoun_ref;
            if (!pr?.pronoun) issues.push({ level: 'warn', where, msg: 'pronoun_ref.pronoun is empty.' });
            const refLen = pr?.referents?.length ?? 0;
            if (!refLen) issues.push({ level: 'error', where, msg: 'pronoun_ref.referents required.' });
            if (pr && (pr.correctIndex == null || pr.correctIndex < 0 || pr.correctIndex >= refLen)) {
                issues.push({ level: 'error', where, msg: 'pronoun_ref.correctIndex out of range.' });
            }
        }

        // 단락 하이라이트 인덱스 범위
        const ph = m.paragraph_highlight.paragraphs ?? [];
        if (ph.some((i: number) => i < 0 || i >= paras.length)) {
            issues.push({
                level: 'error',
                where,
                msg: `paragraph_highlight index out of range (passages have ${paras.length} paragraphs).`,
            });
        }

        // summary 외 유형은 정답 1개
        if (q.type !== 'summary') {
            const cs = (q.choices || []).filter((c) => c.isCorrect);
            if (cs.length !== 1) {
                issues.push({ level: 'error', where, msg: `Single correct choice required. Found ${cs.length}.` });
            }
        }
    });

    return issues;
}

/** 질문 번호 1..N 정규화 */
export function renumberQuestions(qs: RQuestion[]): RQuestion[] {
    return qs.map((q, i) => ({ ...q, number: i + 1 }));
}

/** 최소 세트 팩토리 (SSR/Node 환경 crypto.randomUUID 사용) */
export function makeMinimalSet(id: string): RSet {
    const uid = typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;

    return {
        id,
        label: 'New Reading Set',
        source: '',
        version: 1,
        passages: [
            {
                id: uid,
                title: 'Untitled Passage',
                paragraphs: ['Write your passage here...'],
                questions: [],
            },
        ],
    };
}
