interface Props {
  isSpeaking: boolean
  isListening: boolean
  voiceEnabled: boolean
  onToggleVoice: () => void
}

export default function VoiceIndicator({ isSpeaking, isListening, voiceEnabled, onToggleVoice }: Props) {
  return (
    <div className="voice-indicator">
      <button
        className={`voice-toggle ${voiceEnabled ? 'active' : 'inactive'}`}
        onClick={onToggleVoice}
        title={voiceEnabled ? '關閉語音' : '開啟語音'}
      >
        {voiceEnabled ? '🔊' : '🔇'}
      </button>

      {isSpeaking && (
        <span className="voice-status speaking">
          🗣️ 朗讀中...
        </span>
      )}

      {isListening && (
        <span className="voice-status listening">
          <span className="pulse-dot"></span>
          🎤 聆聽中...
        </span>
      )}
    </div>
  )
}
