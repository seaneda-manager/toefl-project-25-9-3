// apps/web/components/vocab/WordForm.tsx
"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  GRADE_BANDS,
  GRAMMAR_CATEGORIES,
  WORD_SOURCE_TYPES,
  zWordCreatePayload,
  type WordCreatePayload,
} from "@/models/vocab";
import { createWordAction } from "@/app/(protected)/admin/vocab/words/new/actions";

type Props = {
  // 나중에 DB 저장 로직을 외부에서 override 하고 싶을 때 사용
  onSubmit?: (payload: WordCreatePayload) => Promise<void> | void;
};

export default function WordForm({ onSubmit }: Props) {
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<WordCreatePayload>({
    resolver: zodResolver(zWordCreatePayload),
    defaultValues: {
      text: "",
      lemma: "",
      pos: "",
      is_function_word: false,
      meanings_ko: [""],
      meanings_en_simple: [""],
      examples_easy: [],
      examples_normal: [],
      derived_terms: [],
      difficulty: null,
      frequency_score: null,
      notes: "",
      gradeBands: [],
      sources: [],
      semanticTagIds: [],
      grammarHints: [],
    },
  });

  // ===== 배열 필드 (뜻, 예문, 파생어, 출처, 문법 힌트) =====

  const {
    fields: meaningsKoFields,
    append: appendMeaningKo,
    remove: removeMeaningKo,
  } = useFieldArray({
    control,
    name: "meanings_ko",
  });

  const {
    fields: meaningsEnFields,
    append: appendMeaningEn,
    remove: removeMeaningEn,
  } = useFieldArray({
    control,
    name: "meanings_en_simple",
  });

  const {
    fields: examplesEasyFields,
    append: appendExampleEasy,
    remove: removeExampleEasy,
  } = useFieldArray({
    control,
    name: "examples_easy",
  });

  const {
    fields: examplesNormalFields,
    append: appendExampleNormal,
    remove: removeExampleNormal,
  } = useFieldArray({
    control,
    name: "examples_normal",
  });

  const {
    fields: derivedFields,
    append: appendDerived,
    remove: removeDerived,
  } = useFieldArray({
    control,
    name: "derived_terms",
  });

  const {
    fields: sourceFields,
    append: appendSource,
    remove: removeSource,
  } = useFieldArray({
    control,
    name: "sources",
  });

  const {
    fields: grammarFields,
    append: appendGrammar,
    remove: removeGrammar,
  } = useFieldArray({
    control,
    name: "grammarHints",
  });

  // ===== Submit 핸들러 (Server Action 연결) =====

  const internalSubmit = async (data: WordCreatePayload) => {
    setSubmitting(true);
    try {
      if (onSubmit) {
        // 외부에서 커스텀 onSubmit을 넘겨준 경우
        await onSubmit(data);
      } else {
        // 기본 동작: Supabase + vocab_core 스키마에 저장
        const result = await createWordAction(data);
        alert(`단어가 성공적으로 저장되었습니다! (ID: ${result.id})`);
      }

      // 새 단어 입력 편하게 form reset
      reset({
        text: "",
        lemma: "",
        pos: "",
        is_function_word: false,
        meanings_ko: [""],
        meanings_en_simple: [""],
        examples_easy: [],
        examples_normal: [],
        derived_terms: [],
        difficulty: null,
        frequency_score: null,
        notes: "",
        gradeBands: [],
        sources: [],
        semanticTagIds: [],
        grammarHints: [],
      });
    } catch (e: any) {
      console.error(e);
      alert(`저장 중 오류가 발생했습니다: ${e.message ?? "Unknown error"}`);
    } finally {
      setSubmitting(false);
    }
  };

  // =========================================================
  // ======================== RENDER ==========================
  // =========================================================

  return (
    <form
      onSubmit={handleSubmit(internalSubmit)}
      className="space-y-6"
      noValidate
    >
      {/* 기본 정보 */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">기본 정보</h2>

        {/* 표제어 + 품사 + 기능어 여부 */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700">
              단어 (표제어)
            </label>
            <input
              type="text"
              {...register("text")}
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            />
            {errors.text && (
              <p className="mt-1 text-xs text-red-600">
                {errors.text.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              품사 (pos)
            </label>
            <input
              type="text"
              {...register("pos")}
              placeholder="예: n., v., adj."
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            />
            {errors.pos && (
              <p className="mt-1 text-xs text-red-600">
                {errors.pos.message}
              </p>
            )}
          </div>
        </div>

        {/* lemma + 기능어 여부 */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700">
              Lemma (원형)
            </label>
            <input
              type="text"
              {...register("lemma")}
              placeholder="원형이 표제어와 다를 때만 입력"
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>

          <div className="flex items-end">
            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                {...register("is_function_word")}
                className="h-4 w-4"
              />
              <span>기능어 (문법용 단어)</span>
            </label>
          </div>
        </div>

        {/* 난이도 / 빈도 / 메모 */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              난이도 (1–5)
            </label>
            <input
              type="number"
              {...register("difficulty", { valueAsNumber: true })}
              min={1}
              max={5}
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            />
            {errors.difficulty && (
              <p className="mt-1 text-xs text-red-600">
                {errors.difficulty.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              빈도 점수 (optional)
            </label>
            <input
              type="number"
              step="0.01"
              {...register("frequency_score", { valueAsNumber: true })}
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>

          <div className="sm:col-span-1">
            <label className="block text-sm font-medium text-gray-700">
              메모 (notes)
            </label>
            <input
              type="text"
              {...register("notes")}
              placeholder="특이사항, 내부 메모"
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>
        </div>
      </section>

      {/* 뜻 – 한글 / 영영 */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">뜻 (한글 / 영영)</h2>

        {/* 한글 뜻 배열 */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              한글 뜻 (meanings_ko)
            </span>
            <button
              type="button"
              onClick={() => appendMeaningKo("")}
              className="text-xs text-blue-600"
            >
              + 뜻 추가
            </button>
          </div>

          <div className="space-y-2">
            {meaningsKoFields.map((field, index) => (
              <div key={field.id} className="flex gap-2">
                <input
                  type="text"
                  {...register(`meanings_ko.${index}` as const)}
                  className="flex-1 rounded-md border px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={() => removeMeaningKo(index)}
                  className="rounded-md border px-2 text-xs text-gray-500"
                  disabled={meaningsKoFields.length <= 1}
                >
                  삭제
                </button>
              </div>
            ))}
          </div>
          {errors.meanings_ko && (
            <p className="mt-1 text-xs text-red-600">
              {errors.meanings_ko.message as string}
            </p>
          )}
        </div>

        {/* 영영 뜻 배열 */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              영영 정의 (meanings_en_simple)
            </span>
            <button
              type="button"
              onClick={() => appendMeaningEn("")}
              className="text-xs text-blue-600"
            >
              + 정의 추가
            </button>
          </div>

          <div className="space-y-2">
            {meaningsEnFields.map((field, index) => (
              <div key={field.id} className="flex gap-2">
                <input
                  type="text"
                  {...register(`meanings_en_simple.${index}` as const)}
                  className="flex-1 rounded-md border px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={() => removeMeaningEn(index)}
                  className="rounded-md border px-2 text-xs text-gray-500"
                >
                  삭제
                </button>
              </div>
            ))}
          </div>
          {errors.meanings_en_simple && (
            <p className="mt-1 text-xs text-red-600">
              {errors.meanings_en_simple.message as string}
            </p>
          )}
        </div>
      </section>

      {/* 예문 / 파생어 */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">예문 / 파생어</h2>

        {/* 쉬운 예문 */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              쉬운 예문 (examples_easy)
            </span>
            <button
              type="button"
              onClick={() => appendExampleEasy("")}
              className="text-xs text-blue-600"
            >
              + 예문 추가
            </button>
          </div>
          <div className="space-y-2">
            {examplesEasyFields.map((field, index) => (
              <div key={field.id} className="flex gap-2">
                <input
                  type="text"
                  {...register(`examples_easy.${index}` as const)}
                  className="flex-1 rounded-md border px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={() => removeExampleEasy(index)}
                  className="rounded-md border px-2 text-xs text-gray-500"
                >
                  삭제
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 일반 예문 */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              일반 예문 (examples_normal)
            </span>
            <button
              type="button"
              onClick={() => appendExampleNormal("")}
              className="text-xs text-blue-600"
            >
              + 예문 추가
            </button>
          </div>
          <div className="space-y-2">
            {examplesNormalFields.map((field, index) => (
              <div key={field.id} className="flex gap-2">
                <input
                  type="text"
                  {...register(`examples_normal.${index}` as const)}
                  className="flex-1 rounded-md border px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={() => removeExampleNormal(index)}
                  className="rounded-md border px-2 text-xs text-gray-500"
                >
                  삭제
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 파생어 */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              파생어 / 연관어 (derived_terms)
            </span>
            <button
              type="button"
              onClick={() => appendDerived("")}
              className="text-xs text-blue-600"
            >
              + 단어 추가
            </button>
          </div>
          <div className="space-y-2">
            {derivedFields.map((field, index) => (
              <div key={field.id} className="flex gap-2">
                <input
                  type="text"
                  {...register(`derived_terms.${index}` as const)}
                  className="flex-1 rounded-md border px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={() => removeDerived(index)}
                  className="rounded-md border px-2 text-xs text-gray-500"
                >
                  삭제
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 학년대 (gradeBands) */}
      <section className="space-y-2">
        <h2 className="text-lg font-semibold">학년대 (gradeBands)</h2>
        <div className="grid gap-2 sm:grid-cols-3">
          {GRADE_BANDS.map((band) => (
            <label
              key={band}
              className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
            >
              <input
                type="checkbox"
                value={band}
                {...register("gradeBands")}
                className="h-4 w-4"
              />
              <span>{band}</span>
            </label>
          ))}
        </div>
        {errors.gradeBands && (
          <p className="mt-1 text-xs text-red-600">
            {errors.gradeBands.message as string}
          </p>
        )}
      </section>

      {/* 출처 (sources) */}
      <section className="space-y-4">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-lg font-semibold">출처 (sources)</h2>
          <button
            type="button"
            onClick={() =>
              appendSource({
                sourceType: "TEXTBOOK",
                sourceLabel: "",
                examYear: null,
                examMonth: null,
                examRound: null,
                grade: null,
              })
            }
            className="text-xs text-blue-600"
          >
            + 출처 추가
          </button>
        </div>

        <div className="space-y-3">
          {sourceFields.map((field, index) => (
            <div
              key={field.id}
              className="rounded-md border p-3 text-sm shadow-sm"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="font-medium">출처 #{index + 1}</span>
                <button
                  type="button"
                  onClick={() => removeSource(index)}
                  className="text-xs text-gray-500"
                >
                  삭제
                </button>
              </div>

              <div className="grid gap-2 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600">
                    타입
                  </label>
                  <select
                    {...register(`sources.${index}.sourceType` as const)}
                    className="mt-1 w-full rounded-md border px-2 py-1 text-xs"
                  >
                    {WORD_SOURCE_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-600">
                    라벨 (예: 2024 3월 모고 29번)
                  </label>
                  <input
                    type="text"
                    {...register(`sources.${index}.sourceLabel` as const)}
                    className="mt-1 w-full rounded-md border px-2 py-1 text-xs"
                  />
                </div>
              </div>

              <div className="mt-2 grid gap-2 sm:grid-cols-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600">
                    연도
                  </label>
                  <input
                    type="number"
                    {...register(`sources.${index}.examYear` as const, {
                      valueAsNumber: true,
                    })}
                    className="mt-1 w-full rounded-md border px-2 py-1 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600">
                    월
                  </label>
                  <input
                    type="number"
                    {...register(`sources.${index}.examMonth` as const, {
                      valueAsNumber: true,
                    })}
                    className="mt-1 w-full rounded-md border px-2 py-1 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600">
                    회차/구분
                  </label>
                  <input
                    type="text"
                    {...register(`sources.${index}.examRound` as const)}
                    className="mt-1 w-full rounded-md border px-2 py-1 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600">
                    대상 학년대
                  </label>
                  <select
                    {...register(`sources.${index}.grade` as const)}
                    className="mt-1 w-full rounded-md border px-2 py-1 text-xs"
                  >
                    <option value="">(선택)</option>
                    {GRADE_BANDS.map((band) => (
                      <option key={band} value={band}>
                        {band}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 문법 힌트 (grammarHints) */}
      <section className="space-y-4">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-lg font-semibold">문법 힌트 (grammarHints)</h2>
          <button
            type="button"
            onClick={() =>
              appendGrammar({
                grammarCategory: "NONE",
                shortTipKo: "",
                shortTipEn: "",
                wrongExample: "",
                rightExample: "",
                showUntilGrade: null,
                sortOrder: 0,
              })
            }
            className="text-xs text-blue-600"
          >
            + 힌트 추가
          </button>
        </div>

        <div className="space-y-3">
          {grammarFields.map((field, index) => (
            <div
              key={field.id}
              className="rounded-md border p-3 text-sm shadow-sm"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="font-medium">힌트 #{index + 1}</span>
                <button
                  type="button"
                  onClick={() => removeGrammar(index)}
                  className="text-xs text-gray-500"
                >
                  삭제
                </button>
              </div>

              <div className="grid gap-2 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600">
                    카테고리
                  </label>
                  <select
                    {...register(
                      `grammarHints.${index}.grammarCategory` as const,
                    )}
                    className="mt-1 w-full rounded-md border px-2 py-1 text-xs"
                  >
                    {GRAMMAR_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-600">
                    한국어 힌트 (필수)
                  </label>
                  <input
                    type="text"
                    {...register(`grammarHints.${index}.shortTipKo` as const)}
                    className="mt-1 w-full rounded-md border px-2 py-1 text-xs"
                  />
                </div>
              </div>

              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-gray-600">
                    잘못된 예문
                  </label>
                  <input
                    type="text"
                    {...register(
                      `grammarHints.${index}.wrongExample` as const,
                    )}
                    className="mt-1 w-full rounded-md border px-2 py-1 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600">
                    올바른 예문
                  </label>
                  <input
                    type="text"
                    {...register(
                      `grammarHints.${index}.rightExample` as const,
                    )}
                    className="mt-1 w-full rounded-md border px-2 py-1 text-xs"
                  />
                </div>
              </div>

              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-gray-600">
                    힌트 표시 상한 학년대
                  </label>
                  <select
                    {...register(
                      `grammarHints.${index}.showUntilGrade` as const,
                    )}
                    className="mt-1 w-full rounded-md border px-2 py-1 text-xs"
                  >
                    <option value="">(선택)</option>
                    {GRADE_BANDS.map((band) => (
                      <option key={band} value={band}>
                        {band}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600">
                    정렬 순서 (sortOrder)
                  </label>
                  <input
                    type="number"
                    {...register(
                      `grammarHints.${index}.sortOrder` as const,
                      {
                        valueAsNumber: true,
                      },
                    )}
                    className="mt-1 w-full rounded-md border px-2 py-1 text-xs"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 제출 버튼 */}
      <div className="flex justify-end gap-3 border-t pt-4">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-md border px-4 py-2 text-sm text-gray-700"
          disabled={submitting}
        >
          초기화
        </button>
        <button
          type="submit"
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          disabled={submitting}
        >
          {submitting ? "저장 중..." : "단어 저장"}
        </button>
      </div>
    </form>
  );
}
