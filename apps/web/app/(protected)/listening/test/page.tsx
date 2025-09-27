// 최소 호환 트랙 타입(필요 필드만)
type ListeningTrack = {
id: string | number;
title?: string;
name?: string;
label?: string;
};

// ListeningTestRunner props 예시
type Props = {
  track: ListeningTrack;
  onFinish: (sessionId: string) => void;
};
