import { useState, useCallback } from 'react'
import type { QuizPhase, QuizQuestion, AnswerRecord, RoundRecord } from '../types'
import { startRound, checkAnswer, getRoundSummary, getCompleteSentence } from '../services/quizEngine'
import { saveRoundRecord } from '../services/storageService'

interface QuizState {
  phase: QuizPhase
  questions: QuizQuestion[]
  currentIndex: number
  answers: AnswerRecord[]
  currentAnswer: AnswerRecord | null
  roundSummary: RoundRecord | null
}

export function useQuiz() {
  const [state, setState] = useState<QuizState>({
    phase: 'idle',
    questions: [],
    currentIndex: 0,
    answers: [],
    currentAnswer: null,
    roundSummary: null
  })

  const beginRound = useCallback(() => {
    try {
      const questions = startRound()
      setState({
        phase: 'readingQuestion',
        questions,
        currentIndex: 0,
        answers: [],
        currentAnswer: null,
        roundSummary: null
      })
    } catch (e) {
      console.error('Failed to start round:', e)
    }
  }, [])

  const submitAnswer = useCallback((optionIndex: number) => {
    setState(prev => {
      if (prev.phase !== 'waitingAnswer' && prev.phase !== 'readingQuestion') return prev
      const question = prev.questions[prev.currentIndex]
      const answer = checkAnswer(question, optionIndex)
      return {
        ...prev,
        phase: 'feedbackReading',
        currentAnswer: answer,
        answers: [...prev.answers, answer]
      }
    })
  }, [])

  const proceedToNext = useCallback(() => {
    setState(prev => {
      if (prev.phase !== 'waitingNext') return prev

      const nextIndex = prev.currentIndex + 1
      if (nextIndex >= prev.questions.length) {
        // Round complete
        const summary = getRoundSummary(prev.answers)
        saveRoundRecord(summary)
        return { ...prev, phase: 'roundComplete', roundSummary: summary }
      }

      return {
        ...prev,
        phase: 'readingQuestion',
        currentIndex: nextIndex,
        currentAnswer: null
      }
    })
  }, [])

  const finishFeedback = useCallback(() => {
    setState(prev => {
      if (prev.phase !== 'feedbackReading') return prev
      return { ...prev, phase: 'waitingNext' }
    })
  }, [])

  const setPhase = useCallback((phase: QuizPhase) => {
    setState(prev => ({ ...prev, phase }))
  }, [])

  const currentQuestion = state.questions[state.currentIndex] || null

  return {
    phase: state.phase,
    currentQuestion,
    currentIndex: state.currentIndex,
    currentAnswer: state.currentAnswer,
    answers: state.answers,
    roundSummary: state.roundSummary,
    totalQuestions: state.questions.length,
    beginRound,
    submitAnswer,
    proceedToNext,
    finishFeedback,
    setPhase,
    getCompleteSentence
  }
}
