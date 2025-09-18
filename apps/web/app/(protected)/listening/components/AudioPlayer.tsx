'use client';

type Props = { src: string };

export default function AudioPlayer({ src }: Props) {
  return (
    <div className="rounded border p-3">
      <audio controls className="w-full">
        <source src={src} />
        Your browser does not support the audio element.
      </audio>
      <p className="mt-2 text-xs text-gray-500">?ㅻ뵒?ㅺ? ?놁쑝硫?臾댁떆?섍퀬 吏꾪뻾?대룄 ?⑸땲???섑뵆 寃쎈줈).</p>
    </div>
  );
}
