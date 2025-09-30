'use client'
import { useState } from 'react'


type WItem = { id: string; type: 'integrated'|'independent'; title: string; reading?: string; listeningUrl?: string; prompt?: string }


export default function WritingEditorPage() {
const [model, setModel] = useState<WItem>({ id: '', type: 'independent', title: '' })
return (
<div className="space-y-4">
<h3 className="text-base font-semibold">Writing Editor</h3>
<div className="grid gap-2">
<select className="rounded border px-3 py-2 w-44" value={model.type} onChange={(e)=> setModel(m=>({ ...m, type: e.target.value as any }))}>
<option value="independent">Independent</option>
<option value="integrated">Integrated</option>
</select>
<input className="rounded border px-3 py-2" placeholder="Title" value={model.title} onChange={(e)=> setModel(m=>({ ...m, title: e.target.value }))} />
{model.type === 'integrated' ? (
<>
<textarea className="rounded border px-3 py-2 h-32" placeholder="Reading passage (optional)" value={model.reading||''} onChange={(e)=> setModel(m=>({ ...m, reading: e.target.value }))} />
<input className="rounded border px-3 py-2" placeholder="Listening audio URL (optional)" value={model.listeningUrl||''} onChange={(e)=> setModel(m=>({ ...m, listeningUrl: e.target.value }))} />
</>
) : (
<textarea className="rounded border px-3 py-2 h-24" placeholder="Independent prompt" value={model.prompt||''} onChange={(e)=> setModel(m=>({ ...m, prompt: e.target.value }))} />
)}
</div>
<button className="px-3 py-1.5 rounded border" onClick={()=>console.log('[SAVE WRITING]', model)}>Save draft</button>
</div>
)
}
