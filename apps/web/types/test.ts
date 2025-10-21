export type Choice = {
  id: string;
  text: string;
  is_correct?: boolean;
  explain?: string;
};

export type Question = {
  id: string;
  number: number;
  stem: string;
  choices: Choice[];
};

export type Passage = {
  id: string;
  title?: string;
  content?: string;   // reading용 텍스트
  audioUrl?: string;  // listening용 오디오
  questions: Question[];
};
