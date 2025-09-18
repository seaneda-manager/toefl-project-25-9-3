import Player from './Player'

export default function Page() {
  const audioSrc = '/media/p1.mp3'
  const sessionId = '...서버에서 만든 세션 ID...'
  return <Player audioSrc={audioSrc} sessionId={sessionId} />
}
