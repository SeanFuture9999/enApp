import type { WordEntry, SentenceData, WordSentences, QuizQuestion, AnswerRecord, RoundRecord } from '../types'
import wordBankData from '../data/wordBank.json'
import sentencesData from '../data/sentences.json'

// === Word Bank ===
const wordBank: WordEntry[] = wordBankData as WordEntry[]
const sentenceMap = new Map<number, WordSentences>()

// Index sentences by wordId
for (const ws of sentencesData as WordSentences[]) {
  sentenceMap.set(ws.wordId, ws)
}

// Get words that have sentences available
function getAvailableWords(): WordEntry[] {
  return wordBank.filter(w => sentenceMap.has(w.id))
}

// === Shuffle ===
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// === Distractor Selection ===
function selectDistractors(target: WordEntry, exclude: Set<number>): WordEntry[] {
  const available = getAvailableWords().filter(w => w.id !== target.id && !exclude.has(w.id))

  // Priority: same POS
  const samePOS = available.filter(w =>
    w.pos.some(p => target.pos.includes(p))
  )

  const pool = samePOS.length >= 3 ? samePOS : available
  return shuffle(pool).slice(0, 3)
}

// === Start Round ===
export function startRound(): QuizQuestion[] {
  const available = getAvailableWords()
  if (available.length < 10) {
    throw new Error(`Not enough words with sentences. Have ${available.length}, need 10.`)
  }

  const selected = shuffle(available).slice(0, 10)
  const usedIds = new Set(selected.map(w => w.id))

  return selected.map((wordEntry, index) => {
    const ws = sentenceMap.get(wordEntry.id)!
    const sentence = ws.sentences[Math.floor(Math.random() * ws.sentences.length)]

    const distractors = selectDistractors(wordEntry, usedIds)
    distractors.forEach(d => usedIds.add(d.id))

    // Build options array: correct + 3 distractors, then shuffle
    const optionWords = [wordEntry.word, ...distractors.map(d => d.word)]
    const shuffledOptions = shuffle(optionWords)
    const correctOptionIndex = shuffledOptions.indexOf(wordEntry.word)

    return {
      index,
      wordEntry,
      sentence,
      options: shuffledOptions,
      correctOptionIndex
    }
  })
}

// === Check Answer ===
export function checkAnswer(question: QuizQuestion, selectedIndex: number): AnswerRecord {
  return {
    wordId: question.wordEntry.id,
    word: question.wordEntry.word,
    meaning: question.wordEntry.meaning,
    selectedOption: selectedIndex,
    correctOption: question.correctOptionIndex,
    isCorrect: selectedIndex === question.correctOptionIndex,
    sentence: question.sentence
  }
}

// === Round Summary ===
export function getRoundSummary(answers: AnswerRecord[]): RoundRecord {
  const correctCount = answers.filter(a => a.isCorrect).length
  return {
    accuracy: correctCount / answers.length,
    totalQuestions: answers.length,
    correctCount,
    wrongWords: answers
      .filter(a => !a.isCorrect)
      .map(a => ({ word: a.word, meaning: a.meaning })),
    completedAt: new Date().toISOString()
  }
}

// === Get complete sentence (fill in blank) ===
export function getCompleteSentence(sentence: SentenceData): string {
  return sentence.en.replace(/\(_{2,}\)|\(____\)|\(\s*\)/, sentence.answer)
}

// === Get word bank stats ===
export function getStats() {
  return {
    totalWords: wordBank.length,
    availableWords: getAvailableWords().length
  }
}
