"use client";

import React from "react";
import ParrotMascot, { type MascotMood } from "./ParrotMascot";

export default function MascotLayer({
  stage,
  mood = "default",
}: {
  stage: string;
  mood?: MascotMood;
}) {
  const s = String(stage || "").toUpperCase();

  const isLearning = s.includes("LEARNING");
  const isSpeed = s.includes("SPEED");
  const isIntro = s.includes("INTRO"); // optional

  // ✅ Learning에서는 옆에 독립 배치
  const pos = isLearning
    ? "fixed right-2 top-1/2 -translate-y-1/2 z-[10000]"
    : "fixed top-5 right-5 z-[10000]";

  const size = isLearning ? 76 : isSpeed ? 88 : 84;

  // ✅ 원하면 intro 단계에서는 숨길 수도 있음
  if (isIntro) return null;

  return (
    <div className={`${pos} pointer-events-none`}>
      <ParrotMascot mood={mood} size={size} />
    </div>
  );
}
