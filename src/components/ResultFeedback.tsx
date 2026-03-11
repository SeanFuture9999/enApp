import type { AnswerRecord } from '../types'
import { getCompleteSentence } from '../services/quizEngine'

interface Props {
  answer: AnswerRecord
  onNext: () => void
  isLastQuestion: boolean
}

const OPTION_LABELS = ['A', 'B', 'C', 'D']

export default function ResultFeedback({ answer, onNext, isLastQuestion }: Props) {
  const completeSentence = getCompleteSentence(answer.sentence)

  return (
    <div className="result-feedback">
      {/* Judgment */}
      <div className={`judgment ${answer.isCorrect ? 'correct' : 'wrong'}`}>
        {answer.isCorrect
          ? '✅ 正確！'
          : `❌ 錯誤，正確答案是 (${OPTION_LABELS[answer.correctOption]}) ${answer.word}`
        }
      </div>

      {/* Explanation */}
      <div className="explanation">
        <div className="word-detail">
          <strong>{answer.word}</strong> — {answer.meaning}
        </div>
      </div>

      {/* Complete sentence */}
      <div className="complete-sentence">
        <div className="sentence-label">完整句子是：</div>
        <div className="sentence-text">{completeSentence}</div>
      </div>

      {/* Next button */}
      <button className="next-btn" onClick={onNext}>
        {isLastQuestion ? '📊 查看結果' : '➡️ 下一題'}
      </button>

      <div className="voice-hint">
        🎤 說「{isLastQuestion ? '查看結果' : '下一題'}」或點擊按鈕
      </div>
    </div>
  )
}
