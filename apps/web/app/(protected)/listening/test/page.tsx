// 최소 트랙 타입 — id는 문자열로 정규화 추천
export type ListeningTrack = {
  id: string;            // string | number 대신 string 권장 (URL/키로 자주 씀)
  title?: string;
  name?: string;
  label?: string;
};

// Client entry 파일에서 쓸 Props
export type Props = Readonly<{
  track: ListeningTrack;
  onFinishAction?: (sessionId: string) => void; // ← *Action 네이밍으로 경고 제거
}>;
