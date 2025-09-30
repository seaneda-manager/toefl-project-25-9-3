export default function Page() {
const cards = [
{ href: '/(protected)/(teacher)/content/reading/editor', title: 'Reading', desc: 'Passage + Questions' },
{ href: '/(protected)/(teacher)/content/listening/editor', title: 'Listening', desc: 'Audio + Questions' },
{ href: '/(protected)/(teacher)/content/speaking/editor', title: 'Speaking', desc: 'Prompts & Rubrics' },
{ href: '/(protected)/(teacher)/content/writing/editor', title: 'Writing', desc: 'Integrated / Independent' },
{ href: '/(protected)/(teacher)/content/vocab/editor', title: 'Vocab', desc: 'Words, POS, Examples' },
{ href: '/(protected)/(teacher)/content/grammar/editor', title: 'Grammar', desc: 'Topics, Patterns' },
]
return (
<div className="space-y-3">
<h2 className="text-lg font-semibold">Contents Production</h2>
<p className="text-sm text-gray-600">R / L / S / W / Vocab / Grammar 臾몄젣????쒖옉 諛?諛고룷.</p>
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
{cards.map(c => (
<a key={c.href} href={c.href} className="rounded-xl border p-4 hover:shadow">
<div className="font-medium">{c.title}</div>
<div className="text-sm text-gray-600">{c.desc}</div>
</a>
))}
</div>
</div>
)
}
