export type Choice = {
  id: string
  label?: string
  text?: string
  is_correct?: boolean
}

export type Question = {
  id: string
  number?: number
  stem?: string
  type: 'single' | 'summary'
  explanation?: string
  clue_quote?: string
  choices: Choice[]
}

export type Passage = {
  id: string
  title?: string
  content?: string
  questions: Question[]
}
