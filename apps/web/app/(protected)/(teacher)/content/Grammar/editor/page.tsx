'use client'
import { useState } from 'react'


type GItem = { id: string; topic: string; explanation: string; examples?: string; level?: 'beginner'|'intermediate'|'advanced' }


export default function GrammarEditorPage() {
const [model, setModel] = useState<GItem>({ id: '', topic: '', explanation: '' })
return (
<div className="space-y-4">
<h3 className="text-base font-semibold">Grammar Editor</h3>
<div className="grid gap-2">
<input className="rounded border px-3 py-2" placeholder="Topic (e.g., Adjective vs. Adverb)" value={model.topic} onChange={(e)=> setModel(m=>({ ...m, topic: e.target.value }))} />
<textarea className="rounded border px-3 py-2 h-28" placeholder="Explanation" value={model.explanation} onChange={(e)=> setModel(m=>({ ...m, explanation: e.target.value }))} />
<textarea className="rounded border px-3 py-2 h-24" placeholder="Examples (optional)" value={model.examples||''} onChange={(e)=> setModel(m=>({ ...m, examples: e.target.value }))} />
<select className="rounded border px-3 py-2 w-44" value={model.level||'intermediate'} onChange={(e)=> setModel(m=>({ ...m, level: e.target.value as any }))}>
<option value="beginner">Beginner</option>
<option value="intermediate">Intermediate</option>
<option value="advanced">Advanced</option>
</select>
</div>
<button className="px-3 py-1.5 rounded border" onClick={()=>console.log('[SAVE GRAMMAR]', model)}>Save draft</button>
</div>
)
}


