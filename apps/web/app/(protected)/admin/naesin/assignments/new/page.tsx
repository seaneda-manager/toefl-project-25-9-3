"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type TargetType = "student" | "class";
type Status = "assigned" | "in_progress" | "completed" | "closed";

type ScopeOption = {
  id: string;
  title: string;
  schoolLabel: string;
};

const scopeOptions: ScopeOption[] = [
  {
    id: "scope_001",
    title: "송도고1-1 중간 범위 A",
    schoolLabel: "송도고 · 고1 · 1학기 · 중간",
  },
  {
    id: "scope_002",
    title: "중2-1 1차 내신 범위",
    schoolLabel: "샘플중 · 중2 · 1학기 · 월말/학평형",
  },
  {
    id: "scope_003",
    title: "고1 3월 실전 범위",
    schoolLabel: "샘플고 · 고1 · 1학기 · 연습/기타",
  },
];

const classOptions = [
  { id: "class_a", label: "고1A반" },
  { id: "class_b", label: "고1B반" },
  { id: "class_c", label: "중2A반" },
];

const studentOptions = [
  { id: "student_001", label: "student_001" },
  { id: "student_002", label: "student_002" },
  { id: "student_003", label: "student_003" },
];

export const dynamic = "force-dynamic";

export default function AdminNaesinAssignmentsNewPage() {
  const [title, setTitle] = useState("");
  const [scopeId, setScopeId] = useState(scopeOptions[0]?.id ?? "");
  const [targetType, setTargetType] = useState<TargetType>("class");
  const [targetId, setTargetId] = useState(classOptions[0]?.id ?? "");
  const [dueAt, setDueAt] = useState("2026-03-20");
  const [status, setStatus] = useState<Status>("assigned");
  const [reviewRequired, setReviewRequired] = useState(true);
  const [retryAllowed, setRetryAllowed] = useState(true);
  const [memo, setMemo] = useState("");

  const selectedScope = scopeOptions.find((scope) => scope.id === scopeId) ?? null;
  const currentTargets = targetType === "class" ? classOptions : studentOptions;

  const payloadPreview = useMemo(
    () =>
      JSON.stringify(
        {
          title,
          scope_id: scopeId,
          target_type: targetType,
          target_id: targetId,
          due_at: dueAt,
          status,
          review_required: reviewRequired,
          retry_allowed: retryAllowed,
          memo,
        },
        null,
        2,
      ),
    [title, scopeId, targetType, targetId, dueAt, status, reviewRequired, retryAllowed, memo],
  );

  function handleTargetTypeChange(next: TargetType) {
    setTargetType(next);
    setTargetId(next === "class" ? classOptions[0]?.id ?? "" : studentOptions[0]?.id ?? "");
  }

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-6 py-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <div className="text-xs uppercase tracking-[0.18em] text-neutral-400">
            Admin / Naesin / Assignments / New
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
            새 내신 배정 만들기
          </h1>
          <p className="text-sm text-neutral-500">
            시험 범위를 학생 또는 반에 실제로 배정하는 생성 화면.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/naesin/assignments"
            className="rounded-xl border px-4 py-2 text-sm hover:bg-neutral-50"
          >
            목록으로
          </Link>
          <Link
            href="/admin/naesin/scopes"
            className="rounded-xl border px-4 py-2 text-sm hover:bg-neutral-50"
          >
            범위 보러가기
          </Link>
          <button
            type="button"
            disabled
            className="rounded-xl bg-neutral-300 px-4 py-2 text-sm font-medium text-white"
          >
            배정 생성
          </button>
        </div>
      </header>

      <section className="rounded-2xl border bg-white p-5">
        <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-sm font-semibold text-neutral-900">배정 기본 정보</div>
            <p className="mt-1 text-xs text-neutral-500">
              Day 4 기준 필수 필드만 먼저 고정한다.
            </p>
          </div>

          <div className="text-xs text-neutral-500">
            현재 선택 범위: {selectedScope ? selectedScope.title : "-"}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <TextField
            label="배정 제목"
            value={title}
            placeholder="예: 송도고1-1 중간 범위 A 배정"
            onChange={setTitle}
          />

          <SelectField
            label="범위 선택"
            value={scopeId}
            onChange={setScopeId}
            options={scopeOptions.map((scope) => ({
              value: scope.id,
              label: scope.title,
            }))}
          />

          <SelectField
            label="대상 유형"
            value={targetType}
            onChange={(value) => handleTargetTypeChange(value as TargetType)}
            options={[
              { value: "class", label: "반" },
              { value: "student", label: "학생" },
            ]}
          />

          <SelectField
            label="대상 선택"
            value={targetId}
            onChange={setTargetId}
            options={currentTargets.map((target) => ({
              value: target.id,
              label: target.label,
            }))}
          />

          <TextField
            label="마감일"
            value={dueAt}
            placeholder="YYYY-MM-DD"
            onChange={setDueAt}
          />

          <SelectField
            label="상태"
            value={status}
            onChange={(value) => setStatus(value as Status)}
            options={[
              { value: "assigned", label: "배정됨" },
              { value: "in_progress", label: "진행중" },
              { value: "completed", label: "완료" },
              { value: "closed", label: "마감" },
            ]}
          />
        </div>

        {selectedScope ? (
          <div className="mt-4 rounded-xl border bg-neutral-50 px-4 py-3 text-sm text-neutral-700">
            <div className="font-medium text-neutral-900">{selectedScope.title}</div>
            <div className="mt-1 text-xs text-neutral-500">{selectedScope.schoolLabel}</div>
          </div>
        ) : null}
      </section>

      <section className="rounded-2xl border bg-white p-5">
        <div className="mb-4 text-sm font-semibold text-neutral-900">배정 옵션</div>

        <div className="grid gap-4 md:grid-cols-2">
          <BooleanField
            label="Review 필수"
            checked={reviewRequired}
            onChange={setReviewRequired}
          />
          <BooleanField
            label="재시도 허용"
            checked={retryAllowed}
            onChange={setRetryAllowed}
          />
        </div>

        <div className="mt-4">
          <label className="space-y-1.5">
            <div className="text-sm font-medium text-neutral-800">메모</div>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              rows={5}
              placeholder="운영 메모, 공지, 유의사항 등을 입력"
              className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
            />
          </label>
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-5">
        <div className="text-sm font-semibold text-neutral-900">저장 payload 미리보기</div>
        <p className="mt-1 text-xs text-neutral-500">
          다음 단계에서 server action 연결 시 그대로 shape 확인용으로 사용.
        </p>

        <pre className="mt-4 overflow-x-auto rounded-2xl bg-neutral-950 p-4 text-xs leading-6 text-neutral-100">
          {payloadPreview}
        </pre>
      </section>
    </main>
  );
}

function TextField({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-1.5">
      <div className="text-sm font-medium text-neutral-800">{label}</div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="space-y-1.5">
      <div className="text-sm font-medium text-neutral-800">{label}</div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
      >
        {options.map((option) => (
          <option key={`${label}-${option.value}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function BooleanField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-3 rounded-xl border px-3 py-3 text-sm text-neutral-700">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>{label}</span>
    </label>
  );
}
