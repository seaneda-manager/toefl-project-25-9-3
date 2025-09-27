type Mode = 'p' | 't' | 'r'; // practice/test/review

export type PlayArgs = {
  trackId: string;
  mode: Mode;
  volume?: number;        // 0.0~1.0
  getUrl: (trackId: string) => string; // 트랙 URL 리졸버
};

let current: HTMLAudioElement | null = null;

export function play({ trackId, mode, volume = 1, getUrl }: PlayArgs) {
  stop();
  const src = getUrl(trackId);
  current = new Audio(src);
  current.volume = volume;
  // 모드별 정책이 필요하면 여기서 분기
  current.play().catch(() => {});
}

export function stop() {
  if (current) {
    current.pause();
    current.currentTime = 0;
    current = null;
  }
}
