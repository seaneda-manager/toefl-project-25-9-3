// normalized utf8
'use client'
export default function PassagePane({ content }: { content?: string }) {
return (
<article className="prose max-w-none whitespace-pre-wrap rounded-2xl border p-4">
{content ?? 'PassagePane placeholder ???�제 본문??주입?�세??'}
</article>
)
}
