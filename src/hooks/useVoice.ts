import { useState, useEffect, useCallback, useRef } from 'react'
import type { VoiceCommand } from '../types'
import {
  initVoices,
  speakSequence,
  stopSpeaking,
  startListening,
  stopListening,
  isSpeechRecognitionSupported
} from '../services/voiceService'
import { getSettings } from '../services/storageService'

interface VoiceState {
  ttsAvailable: boolean
  sttAvailable: boolean
  isSpeaking: boolean
  isListening: boolean
  voicesReady: boolean
}

export function useVoice() {
  const [state, setState] = useState<VoiceState>({
    ttsAvailable: false,
    sttAvailable: false,
    isSpeaking: false,
    isListening: false,
    voicesReady: false
  })

  const stopListeningRef = useRef<(() => void) | null>(null)

  // Initialize voices on mount
  useEffect(() => {
    async function init() {
      const result = await initVoices()
      setState(prev => ({
        ...prev,
        ttsAvailable: result.en || result.zh,
        sttAvailable: isSpeechRecognitionSupported(),
        voicesReady: true
      }))
    }
    init()
  }, [])

  const speakText = useCallback(async (
    segments: Array<{ text: string; lang: 'en' | 'zh' }>
  ) => {
    const settings = getSettings()
    setState(prev => ({ ...prev, isSpeaking: true }))
    try {
      await speakSequence(segments, settings.speechRate)
    } finally {
      setState(prev => ({ ...prev, isSpeaking: false }))
    }
  }, [])

  const stopSpeak = useCallback(() => {
    stopSpeaking()
    setState(prev => ({ ...prev, isSpeaking: false }))
  }, [])

  const listen = useCallback((
    onCommand: (cmd: VoiceCommand) => void,
    lang: 'en' | 'zh' = 'en'
  ) => {
    if (stopListeningRef.current) {
      stopListeningRef.current()
    }

    setState(prev => ({ ...prev, isListening: true }))
    const cleanup = startListening((cmd) => {
      setState(prev => ({ ...prev, isListening: false }))
      onCommand(cmd)
    }, lang)

    stopListeningRef.current = () => {
      cleanup()
      setState(prev => ({ ...prev, isListening: false }))
    }
  }, [])

  const stopListen = useCallback(() => {
    if (stopListeningRef.current) {
      stopListeningRef.current()
      stopListeningRef.current = null
    }
    stopListening()
    setState(prev => ({ ...prev, isListening: false }))
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopSpeaking()
      stopListening()
    }
  }, [])

  return {
    ...state,
    speakText,
    stopSpeak,
    listen,
    stopListen
  }
}
