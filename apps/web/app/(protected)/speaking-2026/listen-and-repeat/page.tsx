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
    <main className="mx-auto space-y-6 pb-8 max-w-3xl">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold">
          Speaking 2026 ??Task 1: Listen and Repeat (?°ìŠµ)
        </h1>
        <p className="text-sm text-gray-600">
          ?¤ì œ ?œí—˜?ì„œ??ë¬¸ì¥ ?ìŠ¤?¸ëŠ” ë³´ì´ì§€ ?Šê³ , ?¤ë””?¤ë§Œ ?¤ë¦½?ˆë‹¤. ì§€ê¸ˆì?
          ê°œë°œ/?™ìŠµ ?¸ì˜ë¥??„í•´ ë¬¸ì¥???¨ê»˜ ë³´ì—¬ì£¼ëŠ” ë²„ì „?…ë‹ˆ??
        </p>
      </header>

      <ListenAndRepeatRunner
        items={demoItems}
        mode="study"
        repeatSeconds={10}
        onComplete={(result) => {
          console.log("Listen & Repeat ?„ë£Œ ê²°ê³¼:", result);
        }}
      />
    </main>
  );
}
