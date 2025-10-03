import type { RSet } from '@/types/types-reading';

export function validateSet(s: RSet){
  const errs: string[] = [];
  if(!s.passages?.length) errs.push('No passages.');
  s.passages?.forEach((p,pi)=>{
    if(!p.title) errs.push(`P${pi+1}: title missing`);
    if(!p.content) errs.push(`P${pi+1}: content missing`);
    const nums = new Set<number>();
    p.questions?.forEach((q)=>{
      if(nums.has(q.number)) errs.push(`P${pi+1} Q# dup: ${q.number}`);
      nums.add(q.number);
      // single-answer types: exactly one is_correct
      if(q.type !== 'summary' && q.type !== 'organization'){
        const corrects = q.choices.filter(c=>c.is_correct).length;
        if(corrects!==1) errs.push(`P${pi+1} Q${q.number}: single-answer must have exactly 1 correct`);
      }
      // insertion: anchors vs [■]
      if(q.meta?.insertion){
        const countAnchors = (p.content.match(/\[■\]/g)||[]).length;
        const choiceCount = q.choices.length;
        if(countAnchors !== choiceCount) errs.push(`P${pi+1} Q${q.number}: insertion anchors(${countAnchors}) != choices(${choiceCount})`);
      }
      // summary: selectionCount & correct size
      if(q.type==='summary'){
        const sel = q.meta?.summary?.selectionCount ?? 3;
        const corrects = q.choices.filter(c=>c.is_correct).length;
        if(corrects !== sel) errs.push(`P${pi+1} Q${q.number}: summary correct must be ${sel}`);
        if(q.choices.length < sel*2) errs.push(`P${pi+1} Q${q.number}: summary needs >= ${sel*2} choices`);
      }
      // pronoun_ref sanity
      if(q.meta?.pronoun_ref && (q.meta.pronoun_ref.referents?.length??0)<2){
        errs.push(`P${pi+1} Q${q.number}: pronoun_ref needs at least 2 referents`);
      }
      // explanation keys match choice ids
      if(q.explanation?.why_others){
        const ids = new Set(q.choices.map(c=>c.id));
        for (const id of Object.keys(q.explanation.why_others)){
          if(!ids.has(id)) errs.push(`P${pi+1} Q${q.number}: why_others has unknown choice id "${id}"`);
        }
      }
    });
  });
  return errs;
}