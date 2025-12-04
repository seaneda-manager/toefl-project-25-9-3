"use server";

import { z } from "zod";
import { zWordCreatePayload, type WordCreatePayload } from "@/models/vocab";
import { createWordAction } from "../new/actions";

// JSON 안에 [ {...}, {...} ] 형태로 들어오는 bulk payload
const zBulkPayload = z.array(zWordCreatePayload);

export type ImportResult = {
  ok: boolean;
  total: number;
  successCount: number;
  failureCount: number;
  failures: { index: number; error: string }[];
};

export async function importWordsFromJsonText(
  jsonText: string,
): Promise<ImportResult> {
  let parsed: unknown;

  // 1) JSON 파싱
  try {
    parsed = JSON.parse(jsonText);
  } catch (e) {
    return {
      ok: false,
      total: 0,
      successCount: 0,
      failureCount: 0,
      failures: [{ index: -1, error: "JSON 파싱 오류: 유효한 JSON 형식이 아닙니다." }],
    };
  }

  // 2) zod 유효성 검사
  const result = zBulkPayload.safeParse(parsed);
  if (!result.success) {
    return {
      ok: false,
      total: 0,
      successCount: 0,
      failureCount: 0,
      failures: [
        {
          index: -1,
          error: "스키마 유효성 검사 실패 (필드 누락 또는 타입 오류).",
        },
      ],
    };
  }

  const payloads: WordCreatePayload[] = result.data;
  const failures: { index: number; error: string }[] = [];
  let successCount = 0;

  // 3) 하나씩 createWordAction 호출
  for (let i = 0; i < payloads.length; i++) {
    const p = payloads[i];
    try {
      const res = await createWordAction(p);
      console.log("WORD IMPORTED", i, res.id, p.text);
      successCount++;
    } catch (e: any) {
      console.error("IMPORT FAILED", i, p.text, e);
      failures.push({
        index: i,
        error: e?.message ?? "Unknown error",
      });
    }
  }

  return {
    ok: failures.length === 0,
    total: payloads.length,
    successCount,
    failureCount: failures.length,
    failures,
  };
}

// <form action={...}>에서 바로 쓸 수 있는 server action
export async function importWordsFromJsonForm(
  formData: FormData,
): Promise<ImportResult> {
  const jsonText = (formData.get("jsonText") || "") as string;
  return importWordsFromJsonText(jsonText);
}
