'use client'
import { useState } from 'react'


type Vocab = { id: string; word: string; pos: string; meaning: string; example?: string; tags?: string }


export default function VocabEditorPage() {
const [model, setModel] = useState<Vocab>({ id: '', word: '', pos: '', meaning: '' })
return (
<div className="space-y-4">
<h3 className="text-base font-semibold">Vocab Editor</h3>
<div className="grid gap-2">
<input className="rounded border px-3 py-2" placeholder="Word" value={model.word} onChange={(e)=> setModel(m=>({ ...m, word: e.target.value }))} />
<input className="rounded border px-3 py-2" placeholder="Part of Speech (e.g., n., v., adj.)" value={model.pos} onChange={(e)=> setModel(m=>({ ...m, pos: e.target.value }))} />
<textarea className="rounded border px-3 py-2 h-24" placeholder="Meaning (KOR/ENG)" value={model.meaning} onChange={(e)=> setModel(m=>({ ...m, meaning: e.target.value }))} />
<textarea className="rounded border px-3 py-2 h-20" placeholder="Example sentence (optional)" value={model.example||''} onChange={(e)=> setModel(m=>({ ...m, example: e.target.value }))} />
<input className="rounded border px-3 py-2" placeholder="Tags (comma-separated)" value={model.tags||''} onChange={(e)=> setModel(m=>({ ...m, tags: e.target.value }))} />
</div>
<button className="px-3 py-1.5 rounded border" onClick={()=>console.log('[SAVE VOCAB]', model)}>Save draft</button>
</div>
)
}


