import { useEffect, useRef, useCallback, useState } from 'react'
import type { VoiceCommand } from '../types'
import { useQuiz } from '../hooks/useQuiz'
import { useVoice } from '../hooks/useVoice'
import { getSettings, saveSettings } from '../services/storageService'
import { getCompleteSentence } from '../services/quizEngine'
import { onDebugLog } from '../services/voiceService'
import QuestionCard from './QuestionCard'
import ResultFeedback from './ResultFeedback'
import RoundSummary from './RoundSummary'
import VoiceIndicator from './VoiceIndicator'
import SettingsPanel from './SettingsPanel'

interface Props {
  onNavigateRecords: () => void
}

const OPTION_LABELS = ['A', 'B', 'C', 'D']

export default function QuizScreen({ onNavigateRecords }: Props) {
  const quiz = useQuiz()
  const voice = useVoice()
  const [voiceEnabled, setVoiceEnabled] = useState(getSettings().voiceEnabled)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [debugLogs, setDebugLogs] = useState<string[]>([])
  const [showDebug, setShowDebug] = useState(false)
  const phaseRef = useRef(quiz.phase)
  phaseRef.current = quiz.phase

  // Debug log listener
  useEffect(() => {
    onDebugLog((logs) => setDebugLogs(logs))
    return () => onDebugLog(null)
  }, [])

  // Toggle voice
  const toggleVoice = useCallback(() => {
    const newValue = !voiceEnabled
    setVoiceEnabled(newValue)
    saveSettings({ voiceEnabled: newValue })
    if (!newValue) {
      voice.stopSpeak()
      voice.stopListen()
    }
  }, [voiceEnabled, voice])

  // Handle voice command
  const handleVoiceCommand = useCallback((cmd: VoiceCommand) => {
    const currentPhase = phaseRef.current

    if (cmd.type === 'answer' && (currentPhase === 'waitingAnswer' || currentPhase === 'readingQuestion')) {
      const idx = ['A', 'B', 'C', 'D'].indexOf(cmd.value)
      if (idx >= 0) {
        setSelectedIndex(idx)
        quiz.submitAnswer(idx)
      }
    } else if (cmd.type === 'next' && currentPhase === 'waitingNext') {
      quiz.proceedToNext()
    } else if (cmd.type === 'newRound' && currentPhase === 'roundComplete') {
      quiz.beginRound()
    } else if (cmd.type === 'start' && currentPhase === 'idle') {
      quiz.beginRound()
    }
  }, [quiz])

  // Voice: read question when phase changes to readingQuestion
  useEffect(() => {
    if (quiz.phase === 'readingQuestion' && quiz.currentQuestion && voiceEnabled) {
      setSelectedIndex(null)
      const q = quiz.currentQuestion
      const displayEn = q.sentence.en.replace(/\(_{2,}\)|\(____\)/, '(what)')
      const optionsText = q.options.map((o, i) => `(${OPTION_LABELS[i]}) ${o}`).join(', ')

      voice.speakText([
        { text: `第 ${q.index + 1} 題`, lang: 'zh' },
        { text: displayEn, lang: 'en' },
        { text: `中文意思：${q.sentence.zh}`, lang: 'zh' },
        { text: `請問選項是？`, lang: 'zh' },
        { text: optionsText, lang: 'en' }
      ]).then(() => {
        quiz.setPhase('waitingAnswer')
        if (voiceEnabled) {
          voice.listen(handleVoiceCommand, 'en')
        }
      })
    } else if (quiz.phase === 'readingQuestion' && !voiceEnabled) {
      setSelectedIndex(null)
      quiz.setPhase('waitingAnswer')
    }
  }, [quiz.phase, quiz.currentQuestion?.index])

  // Voice: read feedback
  useEffect(() => {
    if (quiz.phase === 'feedbackReading' && quiz.currentAnswer && voiceEnabled) {
      const a = quiz.currentAnswer
      const judgment = a.isCorrect
        ? '正確！'
        : `錯誤，正確答案是 ${OPTION_LABELS[a.correctOption]}，${a.word}`

      const completeSentence = getCompleteSentence(a.sentence)

      voice.speakText([
        { text: judgment, lang: 'zh' },
        { text: `${a.word}，${a.meaning}`, lang: 'zh' },
        { text: '完整句子是：', lang: 'zh' },
        { text: completeSentence, lang: 'en' },
      ]).then(() => {
        quiz.finishFeedback()
        if (voiceEnabled) {
          voice.listen(handleVoiceCommand, 'zh')
        }
      })
    } else if (quiz.phase === 'feedbackReading' && !voiceEnabled) {
      // No voice, just show feedback without auto-advance
    }
  }, [quiz.phase, quiz.currentAnswer])

  // Voice: round complete
  useEffect(() => {
    if (quiz.phase === 'roundComplete' && quiz.roundSummary && voiceEnabled) {
      const s = quiz.roundSummary
      const pct = Math.round(s.accuracy * 100)
      const segments: Array<{ text: string; lang: 'en' | 'zh' }> = [
        { text: `回合結束！正確率 ${pct}%，答對 ${s.correctCount} 題`, lang: 'zh' },
      ]
      if (s.wrongWords.length > 0) {
        segments.push({ text: `錯題：${s.wrongWords.map(w => w.word).join('、')}`, lang: 'zh' })
      }
      segments.push({ text: '要開啟新的一局嗎？', lang: 'zh' })

      voice.speakText(segments).then(() => {
        if (voiceEnabled) {
          voice.listen(handleVoiceCommand, 'zh')
        }
      })
    }
  }, [quiz.phase, quiz.roundSummary])

  // Handle option click — allow during both readingQuestion and waitingAnswer
  const handleOptionClick = (index: number) => {
    if (quiz.phase !== 'waitingAnswer' && quiz.phase !== 'readingQuestion') return
    voice.stopSpeak()
    voice.stopListen()
    setSelectedIndex(index)
    // Force phase to waitingAnswer first if still reading, then submit
    if (quiz.phase === 'readingQuestion') {
      quiz.setPhase('waitingAnswer')
    }
    // Use setTimeout to ensure phase update happens first
    setTimeout(() => quiz.submitAnswer(index), 0)
  }

  // Handle next click
  const handleNextClick = () => {
    voice.stopListen()
    voice.stopSpeak()
    if (quiz.phase === 'feedbackReading') {
      quiz.finishFeedback()
      // Small delay then proceed
      setTimeout(() => quiz.proceedToNext(), 100)
    } else {
      quiz.proceedToNext()
    }
  }

  // Handle start
  const handleStart = () => {
    voice.stopListen()
    quiz.beginRound()
  }

  return (
    <div className="quiz-screen">
      <VoiceIndicator
        isSpeaking={voice.isSpeaking}
        isListening={voice.isListening}
        voiceEnabled={voiceEnabled}
        onToggleVoice={toggleVoice}
      />

      {quiz.phase === 'idle' && (
        <div className="start-screen">
          <h1>🎓 TOEIC 多益單字測驗</h1>
          <p className="subtitle">語音互動式單字練習</p>
          <p className="info">每回合 10 題，可全程語音操作</p>
          <button className="start-btn" onClick={handleStart}>
            🎙️ 開始測驗
          </button>
          <div className="voice-hint">
            🎤 說「開始」即可出題
          </div>
          <button className="records-link" onClick={onNavigateRecords}>
            📋 查看學習紀錄
          </button>
          <button className="settings-link" onClick={() => setShowSettings(true)}>
            ⚙️ 設定
          </button>
        </div>
      )}

      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}

      {(quiz.phase === 'readingQuestion' || quiz.phase === 'waitingAnswer') && quiz.currentQuestion && (
        <div className="quiz-progress">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${((quiz.currentIndex + 1) / quiz.totalQuestions) * 100}%` }}
            />
          </div>
          <span className="progress-text">{quiz.currentIndex + 1} / {quiz.totalQuestions}</span>
        </div>
      )}

      {(quiz.phase === 'readingQuestion' || quiz.phase === 'waitingAnswer') && quiz.currentQuestion && (
        <QuestionCard
          question={quiz.currentQuestion}
          questionNumber={quiz.currentIndex + 1}
          onSelectOption={handleOptionClick}
          disabled={false}
          selectedIndex={selectedIndex}
        />
      )}

      {(quiz.phase === 'feedbackReading' || quiz.phase === 'waitingNext') && quiz.currentAnswer && (
        <>
          <QuestionCard
            question={quiz.currentQuestion!}
            questionNumber={quiz.currentIndex + 1}
            onSelectOption={() => {}}
            disabled={true}
            selectedIndex={selectedIndex}
          />
          <ResultFeedback
            answer={quiz.currentAnswer}
            onNext={handleNextClick}
            isLastQuestion={quiz.currentIndex >= quiz.totalQuestions - 1}
          />
        </>
      )}

      {quiz.phase === 'roundComplete' && quiz.roundSummary && (
        <RoundSummary
          summary={quiz.roundSummary}
          onNewRound={handleStart}
          onViewRecords={onNavigateRecords}
        />
      )}

      {/* Debug Panel (temporary) */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 999 }}>
        <button
          onClick={() => setShowDebug(!showDebug)}
          style={{
            width: '100%', padding: '6px', fontSize: '12px',
            background: '#333', color: '#0f0', border: 'none',
            fontFamily: 'monospace'
          }}
        >
          🔧 Debug ({quiz.phase}) {showDebug ? '▼' : '▲'}
        </button>
        {showDebug && (
          <div style={{
            background: '#111', color: '#0f0', padding: '8px',
            fontSize: '11px', fontFamily: 'monospace', maxHeight: '200px',
            overflow: 'auto', lineHeight: 1.4
          }}>
            <div>Phase: {quiz.phase} | Speaking: {String(voice.isSpeaking)} | Listening: {String(voice.isListening)}</div>
            <div>TTS: {String(voice.ttsAvailable)} | STT: {String(voice.sttAvailable)} | VoiceReady: {String(voice.voicesReady)}</div>
            <hr style={{ borderColor: '#333' }} />
            {debugLogs.map((log, i) => (
              <div key={i} style={{ color: log.includes('ERROR') || log.includes('FATAL') ? '#f44' : log.includes('MATCH') ? '#4f4' : '#0f0' }}>
                {log}
              </div>
            ))}
            {debugLogs.length === 0 && <div style={{ color: '#666' }}>No logs yet...</div>}
          </div>
        )}
      </div>
    </div>
  )
}
