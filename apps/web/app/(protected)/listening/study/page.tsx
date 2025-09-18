import ListeningStudyRunner from './ListeningStudyRunner'
import { SAMPLE_TRACK } from '../_sample'

export default function Page() {
  return <ListeningStudyRunner trackId={SAMPLE_TRACK.id} />
}
