'use client';
import {useEffect, useRef, useState} from 'react';

type Props = { src?:string; oneShot?:boolean; disableSeek?:boolean; onStart?:()=>void; onEnd?:()=>void; };
export default function AudioPlayer({src, oneShot=true, disableSeek=true, onStart, onEnd}:Props){
  const ref = useRef<HTMLAudioElement>(null);
  const [started, setStarted] = useState(false);
  useEffect(()=>{
    const el = ref.current!;
    const onPlay = ()=>{ setStarted(true); onStart?.(); };
    const onEnded = ()=>{ onEnd?.(); };
    el.addEventListener('play', onPlay);
    el.addEventListener('ended', onEnded);
    return ()=>{ el.removeEventListener('play', onPlay); el.removeEventListener('ended', onEnded); };
  },[onStart,onEnd]);
  useEffect(()=>{
    if(!ref.current) return;
    if(disableSeek){
      const block = (e:Event)=>{ e.preventDefault(); (e as any).stopImmediatePropagation?.(); };
      ['seeking','seeked'].forEach(ev=> ref.current!.addEventListener(ev, block));
      return ()=>['seeking','seeked'].forEach(ev=> ref.current!.removeEventListener(ev, block));
    }
  },[disableSeek]);
  return (
    <div className="p-4 flex items-center gap-4">
      {!started && <button className="btn-primary" onClick={()=>ref.current?.play()}>Start Audio</button>}
      <audio ref={ref} src={src} controls={false} />
      <input type="range" min={0} max={1} step={0.01} onChange={e=>{ if(ref.current) ref.current.volume = Number(e.currentTarget.value); }} />
    </div>
  );
}