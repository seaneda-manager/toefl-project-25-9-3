"use client";

import React from "react";
import type { MascotMood } from "./ParrotMascot";

/**
 * FoxMascot — LEXiOX 로고 여우 캐릭터
 * LEXiOX.png에서 여우 부분(좌측 ~38%)만 크롭해서 표시
 */
function moodClass(mood: MascotMood): string {
  switch (mood) {
    case "success":
    case "celebrate":
      return "animate-bounce";
    case "fail":
      return "opacity-60 grayscale";
    case "focus":
      return "drop-shadow-[0_0_8px_rgba(249,115,22,0.6)]";
    case "hint":
      return "animate-pulse";
    case "pause":
      return "opacity-50";
    default:
      return "";
  }
}

export default function FoxMascot({
  mood = "default",
  size = 84,
}: {
  mood?: MascotMood;
  size?: number;
}) {
  const cls = moodClass(mood);

  // LEXiOX.png의 원본 비율: 약 16:5 (가로 길이가 훨씬 긴 로고)
  // 여우 캐릭터는 좌측 약 32% 차지 → overflow hidden으로 크롭
  const logoNaturalW = 520;
  const logoNaturalH = 160;
  const foxFraction = 0.33; // 여우가 차지하는 가로 비율

  // size = 보여줄 영역 높이 기준
  const displayH = size;
  const scale = displayH / logoNaturalH;
  const logoRenderedW = logoNaturalW * scale;
  const displayW = logoRenderedW * foxFraction;

  return (
    <div
      className={`select-none transition-all duration-200 ${cls}`}
      style={{
        width: displayW,
        height: displayH,
        overflow: "hidden",
        position: "relative",
        filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.15))",
      }}
      aria-label="LEXiOX fox mascot"
      role="img"
    >
      <img
        src="/LEXiOX.png"
        alt="LEXiOX fox"
        draggable={false}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: logoRenderedW,
          height: displayH,
          objectFit: "fill",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
