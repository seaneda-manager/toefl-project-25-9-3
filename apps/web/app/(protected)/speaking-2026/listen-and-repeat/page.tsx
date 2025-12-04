// apps/web/app/(protected)/speaking-2026/listen-and-repeat/page.tsx
"use client";

import ListenAndRepeatRunner, {
  ListenRepeatItem,
} from "../components/ListenAndRepeatRunner";

const demoItems: ListenRepeatItem[] = [
  {
    id: "s1",
    sentence: "The student center closes earlier on Fridays.",
  },
  {
    id: "s2",
    sentence: "Many international students attend orientation in the first week.",
  },
  {
    id: "s3",
    sentence: "Please remember to submit your assignment before midnight.",
  },
  {
    id: "s4",
    sentence: "The library will be under renovation during the summer term.",
  },
  {
    id: "s5",
    sentence: "Group projects help students develop communication skills.",
  },
  {
    id: "s6",
    sentence: "Some classes are offered both online and in person.",
  },
  {
    id: "s7",
    sentence: "You can book an appointment with your advisor using the portal.",
  },
];

export default function ListenAndRepeatPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold">
          Speaking 2026 – Task 1: Listen and Repeat (연습)
        </h1>
        <p className="text-sm text-gray-600">
          실제 시험에서는 문장 텍스트는 보이지 않고, 오디오만 들립니다. 지금은
          개발/학습 편의를 위해 문장을 함께 보여주는 버전입니다.
        </p>
      </header>

      <ListenAndRepeatRunner
        items={demoItems}
        mode="study"
        repeatSeconds={10}
        onComplete={(result) => {
          console.log("Listen & Repeat 완료 결과:", result);
        }}
      />
    </main>
  );
}
