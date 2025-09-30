'use client'
import { useState } from 'react'


type SPrompt = { id: string; task: 1|2|3|4; prompt: string; notes?: string }


export default function SpeakingEditorPage() {
const [model, setModel] = useState<SPrompt>({ id: '', task: 1, prompt: '' })
return (
<div className="space-y-4">
<h3 className="text-base font-semibold">Speaking Editor</h3>
<div className="grid gap-2">
<select
className="rounded border px-3 py-2 w-44"
value={model.task}
onChange={(e)=> setModel(m=>({ ...m, task: Number(e.target.value) as 1|2|3|4 }))}
>
<option value={1}>Task 1: Paired Choice</option>
<option value={2}>Task 2: Announcement/Discussion</option>
<option value={3}>Task 3: General/Specific</option>
<option value={4}>Task 4: Academic Summary</option>
</select>
<textarea
className="rounded border px-3 py-2 h-32"
placeholder="Prompt text"
value={model.prompt}
onChange={(e)=> setModel(m=>({ ...m, prompt: e.target.value }))}
/>
</div>
<button className="px-3 py-1.5 rounded border" onClick={()=>console.log('[SAVE SPEAKING]', model)}>Save draft</button>
</div>
)
}
