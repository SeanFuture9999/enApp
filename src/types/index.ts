// === Word Bank ===
export interface WordEntry {
  id: number
  word: string
  pos: string[]
  meaning: string
}

// === Sentence Library ===
export interface SentenceData {
  en: string       // English sentence with (____) blank
  zh: string       // Chinese translation with (是什麼)
  domain: string   // Business domain tag
  answer: string   // The correct word
}

export interface WordSentences {
  wordId: number
  word: string
  sentences: SentenceData[]
}

// === Quiz State ===
export type QuizPhase =
  | 'idle'
  | 'readingQuestion'
  | 'waitingAnswer'
  | 'feedbackReading'
  | 'waitingNext'
  | 'roundComplete'

export interface QuizQuestion {
  index: number            // 0-9
  wordEntry: WordEntry
  sentence: SentenceData
  options: string[]        // 4 options (shuffled)
  correctOptionIndex: number
}

export interface AnswerRecord {
  wordId: number
  word: string
  meaning: string
  selectedOption: number   // 0-3 (A-D)
  correctOption: number    // 0-3
  isCorrect: boolean
  sentence: SentenceData
}

export interface RoundState {
  questions: QuizQuestion[]
  answers: AnswerRecord[]
  currentIndex: number
  phase: QuizPhase
}

// === Learning Records ===
export interface RoundRecord {
  accuracy: number
  totalQuestions: number
  correctCount: number
  wrongWords: { word: string; meaning: string }[]
  completedAt: string
}

export interface DailyRecord {
  date: string              // YYYY-MM-DD
  rounds: RoundRecord[]
}

// === Settings ===
export interface AppSettings {
  speechRate: number        // 0.5 - 2.0
  volume: number            // 0 - 1
  voiceEnabled: boolean
  autoSpeak: boolean
}

// === Voice Commands ===
export type VoiceCommand =
  | { type: 'answer'; value: 'A' | 'B' | 'C' | 'D' }
  | { type: 'next' }
  | { type: 'newRound' }
  | { type: 'start' }
  | { type: 'unknown'; raw: string }
