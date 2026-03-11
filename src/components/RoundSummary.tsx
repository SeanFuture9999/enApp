import type { RoundRecord } from '../types'

interface Props {
  summary: RoundRecord
  onNewRound: () => void
  onViewRecords: () => void
}

export default function RoundSummary({ summary, onNewRound, onViewRecords }: Props) {
  const percentage = Math.round(summary.accuracy * 100)

  return (
    <div className="round-summary">
      <h2>📊 回合結算</h2>

      <div className="score-display">
        <div className="score-circle" data-score={percentage >= 70 ? 'good' : percentage >= 40 ? 'ok' : 'bad'}>
          <span className="score-number">{percentage}%</span>
          <span className="score-label">正確率</span>
        </div>
        <div className="score-detail">
          {summary.correctCount} / {summary.totalQuestions} 題答對
        </div>
      </div>

      {summary.wrongWords.length > 0 && (
        <div className="wrong-list">
          <h3>❌ 錯題清單</h3>
          <ul>
            {summary.wrongWords.map((w, i) => (
              <li key={i}>
                <strong>{w.word}</strong> — {w.meaning}
              </li>
            ))}
          </ul>
        </div>
      )}

      {summary.wrongWords.length === 0 && (
        <div className="perfect-score">
          🎉 全部答對！太厲害了！
        </div>
      )}

      <div className="summary-actions">
        <button className="primary-btn" onClick={onNewRound}>
          🔄 開啟新的一局
        </button>
        <button className="secondary-btn" onClick={onViewRecords}>
          📋 查看學習紀錄
        </button>
      </div>

      <div className="voice-hint">
        🎤 說「新的一局」或「查看紀錄」
      </div>
    </div>
  )
}
