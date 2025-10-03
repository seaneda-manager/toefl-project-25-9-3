// ✅ 컴포넌트 기본 export
export { default as ReadingStudyRunner } from './ReadingStudyRunner';

// ✅ Props 타입은 컴포넌트 파일에서 가져옴
export type { ReadingStudyRunnerProps } from './ReadingStudyRunner';

// ✅ 나머지 타입들은 "단일 소스"에서만 export
export type { RPassage, RQuestion, RChoice } from '@/types/types-reading';
