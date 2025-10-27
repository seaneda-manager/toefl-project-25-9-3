// normalized utf8
type Mode = 'p' | 't' | 'r'; // practice/test/review

export type PlayArgs = {
  trackId: string;
  mode: Mode;
  volume?: number;        // 0.0~1.0
  getUrl: (trackId: string) => string; // ?占쎈옓 URL 由ъ「占?
};

let current: HTMLAudioElement | null = null;

export function play({ trackId, mode, volume = 1, getUrl }: PlayArgs) {
  stop();
  const src = getUrl(trackId);
  current = new Audio(src);
  current.volume = volume;
  // 紐⑤뱶占??占쎌콉???占쎌슂?占쎈㈃ ?占쎄린??遺꾧린
  current.play().catch(() => {});
}

export function stop() {
  if (current) {
    current.pause();
    current.currentTime = 0;
    current = null;
  }
}



