// 理쒖냼 ?몃옓 ?????id??臾몄옄?대줈 ?뺢퇋??異붿쿇
export type ListeningTrack = {
  id: string;            // string | number ???string 沅뚯옣 (URL/?ㅻ줈 ?먯＜ ?)
  title?: string;
  name?: string;
  label?: string;
};

// Client entry ?뚯씪?먯꽌 ??Props
export type Props = Readonly<{
  track: ListeningTrack;
  onFinishAction?: (sessionId: string) => void; // ??*Action ?ㅼ씠諛띿쑝濡?寃쎄퀬 ?쒓굅
}>;


