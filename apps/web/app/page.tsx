'use client';
import HomeSelector from '@/components/HomeSelector';
export default function Page(){
  return (
    <HomeSelector
      onStart={({section,mode})=>{
        if(mode==='study'){
          if(section==='reading') location.href='/reading/study';
          else if(section==='listening') location.href='/listening/study';
          else alert('Study UI 준비중');
        } else {
          if(section==='reading') location.href='/reading/test';
          else if(section==='listening') location.href='/listening/test';
          else alert('Test UI 준비중');
        }
      }}
      onTeacher={({section})=>{
        if(section==='reading') location.href='/teacher/reading';
        else if(section==='listening') location.href='/teacher/listening';
        else alert('Teacher UI 준비중');
      }}
    />
  );
}
