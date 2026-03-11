import type { VoiceCommand } from '../types'

// Web Speech API type declarations (not available in all TS environments)
interface SpeechRecognitionResult {
  readonly length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
}
interface SpeechRecognitionAlternative {
  readonly transcript: string
  readonly confidence: number
}
interface SpeechRecognitionResultList {
  readonly length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}
interface SpeechRecognitionEventType {
  readonly results: SpeechRecognitionResultList
}
interface SpeechRecognitionInstance {
  continuous: boolean
  interimResults: boolean
  lang: string
  maxAlternatives: number
  onresult: ((event: SpeechRecognitionEventType) => void) | null
  onerror: ((event: unknown) => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
}
interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInstance
}

// === Voice availability ===
let enVoice: SpeechSynthesisVoice | null = null
let zhVoice: SpeechSynthesisVoice | null = null

function loadVoices(): Promise<void> {
  return new Promise((resolve) => {
    const tryLoad = () => {
      const voices = speechSynthesis.getVoices()
      if (voices.length === 0) return false

      // Find best English voice
      enVoice = voices.find(v => v.lang === 'en-US' && v.localService) ||
        voices.find(v => v.lang.startsWith('en-US')) ||
        voices.find(v => v.lang.startsWith('en')) || null

      // Find best Chinese voice (Traditional Chinese preferred)
      zhVoice = voices.find(v => v.lang === 'zh-TW') ||
        voices.find(v => v.lang.startsWith('zh-TW')) ||
        voices.find(v => v.lang.startsWith('zh-Hant')) ||
        voices.find(v => v.lang.startsWith('zh')) || null

      return true
    }

    if (tryLoad()) {
      resolve()
      return
    }

    speechSynthesis.onvoiceschanged = () => {
      tryLoad()
      resolve()
    }

    // Fallback timeout
    setTimeout(() => { tryLoad(); resolve() }, 2000)
  })
}

export async function initVoices(): Promise<{ en: boolean; zh: boolean }> {
  if (!('speechSynthesis' in window)) {
    return { en: false, zh: false }
  }
  await loadVoices()
  return { en: !!enVoice, zh: !!zhVoice }
}

// === TTS (Text-to-Speech) ===
let speakQueue: SpeechSynthesisUtterance[] = []
let isSpeaking = false
let onSpeakDone: (() => void) | null = null

function processQueue() {
  if (speakQueue.length === 0) {
    isSpeaking = false
    onSpeakDone?.()
    onSpeakDone = null
    return
  }

  isSpeaking = true
  const utterance = speakQueue.shift()!
  utterance.onend = () => processQueue()
  utterance.onerror = () => processQueue()
  speechSynthesis.speak(utterance)
}

export function speak(text: string, lang: 'en' | 'zh', rate: number = 0.9): void {
  if (!('speechSynthesis' in window)) return
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.voice = lang === 'en' ? enVoice : zhVoice
  utterance.lang = lang === 'en' ? 'en-US' : 'zh-TW'
  utterance.rate = rate
  utterance.pitch = 1
  speakQueue.push(utterance)
  if (!isSpeaking) processQueue()
}

export function speakSequence(
  segments: Array<{ text: string; lang: 'en' | 'zh' }>,
  rate: number = 0.9
): Promise<void> {
  return new Promise((resolve) => {
    stopSpeaking()
    onSpeakDone = resolve
    for (const seg of segments) {
      speak(seg.text, seg.lang, rate)
    }
    if (segments.length === 0) resolve()
  })
}

export function stopSpeaking(): void {
  speechSynthesis.cancel()
  speakQueue = []
  isSpeaking = false
  onSpeakDone = null
}

// === Debug Log (temporary) ===
type DebugListener = (logs: string[]) => void
const debugLogs: string[] = []
let debugListener: DebugListener | null = null

function debugLog(msg: string) {
  const time = new Date().toLocaleTimeString('en', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const entry = `[${time}] ${msg}`
  debugLogs.push(entry)
  if (debugLogs.length > 20) debugLogs.shift()
  debugListener?.([...debugLogs])
}

export function onDebugLog(listener: DebugListener | null) {
  debugListener = listener
  if (listener) listener([...debugLogs])
}

// === STT (Speech-to-Text) ===
let recognition: SpeechRecognitionInstance | null = null
let keepListening = false
let currentOnResult: ((command: VoiceCommand) => void) | null = null
let currentLang: 'en' | 'zh' = 'en'
let restartTimer: ReturnType<typeof setTimeout> | null = null

export function isSpeechRecognitionSupported(): boolean {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supported = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in (window as any)
  debugLog(`STT supported: ${supported} (SR: ${'SpeechRecognition' in window}, webkit: ${'webkitSpeechRecognition' in window})`)
  return supported
}

function createRecognition(): SpeechRecognitionInstance | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any
  if (!w.SpeechRecognition && !w.webkitSpeechRecognition) {
    debugLog('createRecognition: no constructor found')
    return null
  }
  const SpeechRecognitionCtor: SpeechRecognitionConstructor = w.SpeechRecognition || w.webkitSpeechRecognition
  debugLog(`createRecognition: using ${w.SpeechRecognition ? 'SpeechRecognition' : 'webkitSpeechRecognition'}`)
  return new SpeechRecognitionCtor()
}

function startRecognitionSession() {
  debugLog(`startSession: keepListening=${keepListening}, hasCallback=${!!currentOnResult}, lang=${currentLang}`)
  if (!keepListening || !currentOnResult) return

  // Clean up previous
  if (recognition) {
    try { recognition.stop() } catch { /* ignore */ }
  }

  recognition = createRecognition()
  if (!recognition) {
    debugLog('startSession: FAILED to create recognition')
    return
  }

  recognition.continuous = false
  recognition.interimResults = false
  recognition.lang = currentLang === 'en' ? 'en-US' : 'zh-TW'
  recognition.maxAlternatives = 5

  recognition.onresult = (event: SpeechRecognitionEventType) => {
    const results = event.results[0]
    const transcripts: string[] = []
    for (let i = 0; i < results.length; i++) {
      transcripts.push(results[i].transcript.trim())
    }
    debugLog(`onresult: [${transcripts.join(' | ')}]`)

    // Check all alternatives for best match
    for (let i = 0; i < results.length; i++) {
      const transcript = results[i].transcript.trim().toLowerCase()
      const command = parseCommand(transcript)
      if (command.type !== 'unknown') {
        debugLog(`MATCH: type=${command.type}, value=${'value' in command ? command.value : ''}`)
        keepListening = false
        currentOnResult?.(command)
        return
      }
    }
    debugLog('No valid match, will restart...')
    // No valid match — keep listening, auto-restart via onend
  }

  recognition.onerror = (event: unknown) => {
    const errorEvent = event as { error?: string; message?: string }
    const errorType = errorEvent?.error || 'unknown'
    debugLog(`onerror: ${errorType} (${errorEvent?.message || ''})`)
    if (errorType === 'not-allowed' || errorType === 'service-not-allowed') {
      debugLog('FATAL error, stopping')
      keepListening = false
    }
  }

  recognition.onend = () => {
    debugLog(`onend: keepListening=${keepListening}`)
    if (keepListening) {
      restartTimer = setTimeout(() => {
        if (keepListening) {
          debugLog('Restarting recognition...')
          startRecognitionSession()
        }
      }, 300)
    }
  }

  try {
    recognition.start()
    debugLog('recognition.start() OK')
  } catch (e) {
    debugLog(`recognition.start() ERROR: ${e}`)
    restartTimer = setTimeout(() => {
      if (keepListening) {
        startRecognitionSession()
      }
    }, 500)
  }
}

export function startListening(
  onResult: (command: VoiceCommand) => void,
  lang: 'en' | 'zh' = 'en'
): () => void {
  debugLog(`startListening called, lang=${lang}`)
  if (!isSpeechRecognitionSupported()) {
    debugLog('STT not supported, aborting')
    return () => {}
  }

  stopListening()

  keepListening = true
  currentOnResult = onResult
  currentLang = lang

  startRecognitionSession()

  return () => stopListening()
}

export function stopListening(): void {
  debugLog('stopListening called')
  keepListening = false
  currentOnResult = null
  if (restartTimer) {
    clearTimeout(restartTimer)
    restartTimer = null
  }
  if (recognition) {
    try { recognition.stop() } catch { /* ignore */ }
    recognition = null
  }
}

// === Command Parsing ===
// Flexible matching: check if transcript CONTAINS answer indicators
// On mobile, speech recognition often adds extra words/noise around the actual answer

function findAnswerInText(text: string): 'A' | 'B' | 'C' | 'D' | null {
  const cleaned = text.replace(/\s+/g, '').toLowerCase()

  // Strategy 1: Check for explicit Chinese commands (most reliable)
  if (/選a|第一/.test(cleaned)) return 'A'
  if (/選b|第二/.test(cleaned)) return 'B'
  if (/選c|第三/.test(cleaned)) return 'C'
  if (/選d|第四/.test(cleaned)) return 'D'

  // Strategy 2: Check for English "answer X" pattern
  const answerMatch = cleaned.match(/answer\s*([abcd])/i)
  if (answerMatch) return answerMatch[1].toUpperCase() as 'A' | 'B' | 'C' | 'D'

  // Strategy 3: Check individual words in original text for single letter answers
  const words = text.trim().split(/\s+/)
  for (const word of words) {
    const w = word.toLowerCase().replace(/[^a-z0-9]/g, '')
    // Single letter or repeated single letter (e.g., "a", "aaa", "aaaaaaa")
    if (/^a+$/i.test(w)) return 'A'
    if (/^b+$/i.test(w) || w === 'be' || w === 'bee') return 'B'
    if (/^c+$/i.test(w) || w === 'see' || w === 'sea') return 'C'
    if (/^d+$/i.test(w) || w === 'de' || w === 'dee') return 'D'
    // Number answers
    if (w === '1' || w === 'one' || w === 'first') return 'A'
    if (w === '2' || w === 'two' || w === 'second') return 'B'
    if (w === '3' || w === 'three' || w === 'third') return 'C'
    if (w === '4' || w === 'four' || w === 'fourth') return 'D'
  }

  // Strategy 4: Check for phonetic patterns anywhere in cleaned text
  if (/^a+y?$|^ei$|^hey$/i.test(cleaned)) return 'A'
  if (/^b+[ei]?$|^bi$/i.test(cleaned)) return 'B'
  if (/^c+$|^si$/i.test(cleaned)) return 'C'
  if (/^d+[ei]?$/i.test(cleaned)) return 'D'

  return null
}

const NEXT_PATTERNS = /(下一題|繼續|next|continue|下一個)/i
const NEW_ROUND_PATTERNS = /(新的一局|再來一局|new\s*round|再來|開始新的|新一局|開新局)/i
const START_PATTERNS = /(開始|start|begin|出題)/i

function parseCommand(text: string): VoiceCommand {
  // Try answer matching first (flexible, handles noise)
  const answer = findAnswerInText(text)
  if (answer) {
    return { type: 'answer', value: answer }
  }

  const cleaned = text.replace(/\s+/g, '').toLowerCase()

  // Command matching (uses contains instead of exact match)
  if (NEXT_PATTERNS.test(cleaned)) return { type: 'next' }
  if (NEW_ROUND_PATTERNS.test(cleaned)) return { type: 'newRound' }
  if (START_PATTERNS.test(cleaned)) return { type: 'start' }

  return { type: 'unknown', raw: text }
}
