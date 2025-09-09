'use client';

type Props = { src: string };

export default function AudioPlayer({ src }: Props) {
  return (
    <div className="rounded border p-3">
      <audio controls className="w-full">
        <source src={src} />
        Your browser does not support the audio element.
      </audio>
      <p className="mt-2 text-xs text-gray-500">오디오가 없으면 무시하고 진행해도 됩니다(샘플 경로).</p>
    </div>
  );
}
