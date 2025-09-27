'use client';

// 실제 구현은 우리가 만든 Runner를 사용
import BaseRunner from '@/app/listening/ListeningTestRunner';

// 최소 호환 타입(넓게 잡아서 충돌 방지)
type ListeningTrackCompat = {
  id?: string | number;
  title?: string;
  name?: string;
  label?: string;
};

type Props = {
  track: ListeningTrackCompat;
  // Adapter는 (sid: number)로 넘김 → 여기에 맞춰서 정의
  onFinish?: (sid: number) => void | undefined;
} & Record<string, unknown>; // 여분 props 들어와도 통과

export default function ListeningTestRunner(_props: Props) {
  // props는 사용하지 않고 실제 러너로 위임
  return <BaseRunner />;
}
