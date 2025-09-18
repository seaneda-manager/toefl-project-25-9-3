'use client'
export default function PassagePane({ content }: { content?: string }) {
return (
<article className="prose max-w-none whitespace-pre-wrap rounded-2xl border p-4">
{content ?? 'PassagePane placeholder — 실제 본문을 주입하세요.'}
</article>
)
}