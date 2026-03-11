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

// === STT (Speech-to-Text) ===
let recognition: SpeechRecognitionInstance | null = null

export function isSpeechRecognitionSupported(): boolean {
  return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
}

export function startListening(
  onResult: (command: VoiceCommand) => void,
  lang: 'en' | 'zh' = 'en'
): () => void {
  if (!isSpeechRecognitionSupported()) return () => {}

  stopListening()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const SpeechRecognitionCtor: SpeechRecognitionConstructor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  recognition = new SpeechRecognitionCtor()
  recognition.continuous = false
  recognition.interimResults = false
  recognition.lang = lang === 'en' ? 'en-US' : 'zh-TW'
  recognition.maxAlternatives = 5

  recognition.onresult = (event: SpeechRecognitionEventType) => {
    const results = event.results[0]
    // Check all alternatives for best match
    for (let i = 0; i < results.length; i++) {
      const transcript = results[i].transcript.trim().toLowerCase()
      const command = parseCommand(transcript)
      if (command.type !== 'unknown') {
        onResult(command)
        return
      }
    }
    // If no match found, send the first result as unknown
    onResult(parseCommand(results[0].transcript.trim().toLowerCase()))
  }

  recognition.onerror = () => {
    // Silently handle errors - user can tap button instead
  }

  recognition.onend = () => {
    // Auto-restart if still in listening mode
  }

  recognition.start()

  return () => stopListening()
}

export function stopListening(): void {
  if (recognition) {
    try { recognition.stop() } catch { /* ignore */ }
    recognition = null
  }
}

// === Command Parsing ===
const ANSWER_PATTERNS: Record<string, RegExp> = {
  A: /^(a|ay|ei|hey|選a|answer a|第一|first|1|one|ㄟ)$/i,
  B: /^(b|be|bee|bi|選b|answer b|第二|second|2|two)$/i,
  C: /^(c|see|sea|si|選c|answer c|第三|third|3|three)$/i,
  D: /^(d|de|dee|di|選d|answer d|第四|fourth|4|four)$/i,
}

const NEXT_PATTERNS = /^(下一題|繼續|next|continue|下一個)$/i
const NEW_ROUND_PATTERNS = /^(新的一局|再來一局|new round|再來|開始新的|新一局|開新局)$/i
const START_PATTERNS = /^(開始|start|begin|go|出題)$/i

function parseCommand(text: string): VoiceCommand {
  const cleaned = text.replace(/\s+/g, '').toLowerCase()

  for (const [letter, pattern] of Object.entries(ANSWER_PATTERNS)) {
    if (pattern.test(cleaned)) {
      return { type: 'answer', value: letter as 'A' | 'B' | 'C' | 'D' }
    }
  }

  if (NEXT_PATTERNS.test(cleaned)) return { type: 'next' }
  if (NEW_ROUND_PATTERNS.test(cleaned)) return { type: 'newRound' }
  if (START_PATTERNS.test(cleaned)) return { type: 'start' }

  return { type: 'unknown', raw: text }
}
