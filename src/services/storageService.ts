import type { DailyRecord, RoundRecord, AppSettings } from '../types'

const KEYS = {
  records: 'toeic_records',
  settings: 'toeic_settings',
  version: 'toeic_version'
} as const

const DEFAULT_SETTINGS: AppSettings = {
  speechRate: 0.9,
  volume: 1.0,
  voiceEnabled: true,
  autoSpeak: true
}

// === Settings ===
export function getSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(KEYS.settings)
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function saveSettings(settings: Partial<AppSettings>): void {
  const current = getSettings()
  localStorage.setItem(KEYS.settings, JSON.stringify({ ...current, ...settings }))
}

// === Records ===
export function getAllRecords(): DailyRecord[] {
  try {
    const raw = localStorage.getItem(KEYS.records)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveRoundRecord(record: RoundRecord): void {
  const records = getAllRecords()
  const today = new Date().toISOString().split('T')[0]

  let dayRecord = records.find(r => r.date === today)
  if (!dayRecord) {
    dayRecord = { date: today, rounds: [] }
    records.push(dayRecord)
  }
  dayRecord.rounds.push(record)

  // Sort by date descending
  records.sort((a, b) => b.date.localeCompare(a.date))
  localStorage.setItem(KEYS.records, JSON.stringify(records))
}

// === Stats ===
export function getOverallStats() {
  const records = getAllRecords()
  let totalRounds = 0
  let totalQuestions = 0
  let totalCorrect = 0

  for (const day of records) {
    for (const round of day.rounds) {
      totalRounds++
      totalQuestions += round.totalQuestions
      totalCorrect += round.correctCount
    }
  }

  return {
    totalDays: records.length,
    totalRounds,
    totalQuestions,
    totalCorrect,
    avgAccuracy: totalQuestions > 0 ? totalCorrect / totalQuestions : 0
  }
}
