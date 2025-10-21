type Mode = 'p' | 't' | 'r'; // practice/test/review

export type PlayArgs = {
  trackId: string;
  mode: Mode;
  volume?: number;        // 0.0~1.0
  getUrl: (trackId: string) => string; // ?¸ëž™ URL ë¦¬ì¡¸ë²?
};

let current: HTMLAudioElement | null = null;

export function play({ trackId, mode, volume = 1, getUrl }: PlayArgs) {
  stop();
  const src = getUrl(trackId);
  current = new Audio(src);
  current.volume = volume;
  // ëª¨ë“œë³??•ì±…???„ìš”?˜ë©´ ?¬ê¸°??ë¶„ê¸°
  current.play().catch(() => {});
}

export function stop() {
  if (current) {
    current.pause();
    current.currentTime = 0;
    current = null;
  }
}

