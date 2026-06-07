"use client";

import React from "react";
import type { MascotMood } from "./ParrotMascot";

const MOOD_IMAGE: Record<MascotMood, string> = {
  default:   "/lingox/mascot/fox/fox-default.png",
  success:   "/lingox/mascot/fox/fox-happy.png",
  celebrate: "/lingox/mascot/fox/fox-celebrate.png",
  fail:      "/lingox/mascot/fox/fox-calm.png",
  focus:     "/lingox/mascot/fox/fox-focus.png",
  hint:      "/lingox/mascot/fox/fox-hint.png",
  pause:     "/lingox/mascot/fox/fox-calm.png",
};

const MOOD_ANIM: Record<MascotMood, string> = {
  default:   "fox-idle 3s ease-in-out infinite",
  success:   "fox-bounce 500ms cubic-bezier(0.2,1.2,0.2,1) 1",
  celebrate: "fox-bounce 500ms cubic-bezier(0.2,1.2,0.2,1) 1",
  fail:      "fox-droop 400ms ease-out 1",
  focus:     "fox-idle 2s ease-in-out infinite",
  hint:      "fox-wiggle 500ms ease-out 1",
  pause:     "none",
};

export default function FoxMascot({
  mood = "default",
  size = 100,
}: {
  mood?: MascotMood;
  size?: number;
}) {
  const src  = MOOD_IMAGE[mood] ?? MOOD_IMAGE.default;
  const anim = MOOD_ANIM[mood]  ?? "none";

  return (
    <>
      <div
        style={{
          width: size,
          height: size,
          animation: anim,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          filter: mood === "fail"
            ? "drop-shadow(0 4px 8px rgba(0,0,0,0.12)) grayscale(0.3)"
            : "drop-shadow(0 4px 12px rgba(0,0,0,0.15))",
        }}
        aria-label="Lingo-X Fox mascot"
        role="img"
      >
        <img
          src={src}
          alt=""
          draggable={false}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            pointerEvents: "none",
          }}
        />
      </div>

      <style jsx global>{`
        @keyframes fox-idle {
          0%,100% { transform: translateY(0) scale(1); }
          50%      { transform: translateY(-4px) scale(1.01); }
        }
        @keyframes fox-bounce {
          0%   { transform: translateY(0) scale(1); }
          35%  { transform: translateY(-12px) scale(1.06); }
          65%  { transform: translateY(2px) scale(0.98); }
          100% { transform: translateY(0) scale(1); }
        }
        @keyframes fox-droop {
          0%   { transform: translateY(0); }
          40%  { transform: translateY(5px) scale(0.98); }
          100% { transform: translateY(0); }
        }
        @keyframes fox-wiggle {
          0%,100% { transform: rotate(0deg); }
          25%     { transform: rotate(-6deg) scale(1.04); }
          75%     { transform: rotate(5deg) scale(1.04); }
        }
      `}</style>
    </>
  );
}
