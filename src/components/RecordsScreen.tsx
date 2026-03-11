import { useMemo } from 'react'
import { getAllRecords, getOverallStats } from '../services/storageService'

interface Props {
  onBack: () => void
}

export default function RecordsScreen({ onBack }: Props) {
  const records = useMemo(() => getAllRecords(), [])
  const stats = useMemo(() => getOverallStats(), [])

  return (
    <div className="records-screen">
      <div className="records-header">
        <button className="back-btn" onClick={onBack}>← 返回測驗</button>
        <h2>📋 學習紀錄</h2>
      </div>

      {/* Overall stats */}
      <div className="stats-overview">
        <div className="stat-item">
          <span className="stat-value">{stats.totalDays}</span>
          <span className="stat-label">學習天數</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{stats.totalRounds}</span>
          <span className="stat-label">總回合數</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{stats.totalQuestions}</span>
          <span className="stat-label">總答題數</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{Math.round(stats.avgAccuracy * 100)}%</span>
          <span className="stat-label">平均正確率</span>
        </div>
      </div>

      {/* Daily records */}
      <div className="daily-records">
        {records.length === 0 && (
          <div className="empty-records">
            還沒有學習紀錄，開始第一局測驗吧！
          </div>
        )}

        {records.map(day => (
          <div key={day.date} className="day-record">
            <div className="day-header">
              <span className="day-date">📅 {day.date}</span>
              <span className="day-rounds">{day.rounds.length} 回合</span>
            </div>

            {day.rounds.map((round, i) => (
              <div key={i} className="round-item">
                <div className="round-info">
                  <span className="round-number">第 {i + 1} 局</span>
                  <span className={`round-accuracy ${round.accuracy >= 0.7 ? 'good' : round.accuracy >= 0.4 ? 'ok' : 'bad'}`}>
                    {Math.round(round.accuracy * 100)}%
                  </span>
                  <span className="round-score">{round.correctCount}/{round.totalQuestions}</span>
                </div>

                {round.wrongWords.length > 0 && (
                  <div className="round-wrong-words">
                    {round.wrongWords.map((w, j) => (
                      <span key={j} className="wrong-word-chip">
                        {w.word}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
