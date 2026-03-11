import type { QuizQuestion } from '../types'

interface Props {
  question: QuizQuestion
  questionNumber: number
  onSelectOption: (index: number) => void
  disabled: boolean
  selectedIndex: number | null
}

const OPTION_LABELS = ['A', 'B', 'C', 'D']

export default function QuestionCard({ question, questionNumber, onSelectOption, disabled, selectedIndex }: Props) {
  // Replace (____) with (what) for display
  const displayEn = question.sentence.en.replace(/\(_{2,}\)|\(____\)/, '(what)')
  const displayZh = question.sentence.zh

  return (
    <div className="question-card">
      <div className="question-header">
        <span className="question-icon">🎙️</span>
        <span className="question-number">第 {questionNumber} 題</span>
        <span className="domain-tag">{question.sentence.domain}</span>
      </div>

      <div className="question-sentence">
        {displayEn}
      </div>

      <div className="question-chinese">
        <span className="chinese-icon">📝</span>
        <span className="chinese-label">中文意思：</span>
        {displayZh}
      </div>

      <div className="question-prompt">
        ❓ 請問選項是？
      </div>

      <div className="options-grid">
        {question.options.map((option, i) => {
          const isSelected = selectedIndex === i
          const isCorrect = i === question.correctOptionIndex
          const showResult = selectedIndex !== null

          let className = 'option-btn'
          if (showResult && isSelected && isCorrect) className += ' correct'
          else if (showResult && isSelected && !isCorrect) className += ' wrong'
          else if (showResult && isCorrect) className += ' correct-hint'

          return (
            <button
              key={i}
              className={className}
              onClick={() => !disabled && onSelectOption(i)}
              disabled={disabled}
            >
              <span className="option-label">({OPTION_LABELS[i]})</span>
              <span className="option-word">{option}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
