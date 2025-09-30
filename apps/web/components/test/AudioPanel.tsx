'use client';
import React, { useRef, useState } from 'react';
import AudioPlayer from '@/app/components/AudioPlayer';

export default function AudioPanel({
  src,
  allowSeek = true,
  allowSpeed = true,
}: {
  src: string;
  allowSeek?: boolean;
  allowSpeed?: boolean;
}) {
  // ?꾩옱 AudioPlayer媛 ?쒖빟 ?듭뀡??吏곸젒 諛쏆? ?딅뒗?ㅻ㈃,
  // ?쇰떒 ?섑띁留??먭퀬, 異뷀썑 而댄룷?뚰듃 ?대? 援ы쁽??諛붽씀硫???
  // (Exam 紐⑤뱶 ?쒗븳? ?곸쐞?먯꽌 鍮꾪솢?깊솕/媛?대뵫?쇰줈 泥섎━ 媛??
  return (
    <div className="space-y-2">
      <AudioPlayer src={src} />
      {!allowSeek && (
        <div className="text-xs text-gray-500">Seeking disabled in exam mode</div>
      )}
      {!allowSpeed && (
        <div className="text-xs text-gray-500">Speed control disabled in exam mode</div>
      )}
    </div>
  );
}

