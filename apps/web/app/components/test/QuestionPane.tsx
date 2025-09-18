'use client'


type Choice = { id: string; label?: string; text?: string }
type Question = { id: string; number?: number; stem?: string; choices: Choice[] }


export default function QuestionPane({
questions = [],
answers = {},
onChange,
disabled,
}: {
questions: Question[]
answers: Record<string, string>
onChange: (qid: string, cid: string) => void
disabled?: boolean
}) {
return (
<div className="rounded-2xl border p-4">
<p className="text-sm text-gray-500">QuestionPane placeholder — 프로젝트 컴포넌트로 교체 가능</p>
</div>
)
}