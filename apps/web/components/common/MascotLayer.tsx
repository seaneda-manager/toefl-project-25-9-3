"use client";

import React from "react";
import FoxMascot from "./FoxMascot";
import type { MascotMood } from "./ParrotMascot";

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
  const isIntro = s.includes("INTRO");

  const pos = isLearning
    ? "fixed right-2 top-1/2 -translate-y-1/2 z-[10000]"
    : "fixed top-4 right-4 z-[10000]";

  const size = isLearning ? 110 : isSpeed ? 130 : 150;

  if (isIntro) return null;

  return (
    <div className={`${pos} pointer-events-none`}>
      <FoxMascot mood={mood} stage={s} size={size} />
    </div>
  );
}
