import { useState } from 'react'
import { getSettings, saveSettings } from '../services/storageService'

interface Props {
  onClose: () => void
}

export default function SettingsPanel({ onClose }: Props) {
  const [settings, setSettings] = useState(getSettings())

  const updateSetting = (key: string, value: number | boolean) => {
    const updated = { ...settings, [key]: value }
    setSettings(updated)
    saveSettings({ [key]: value })
  }

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-panel" onClick={e => e.stopPropagation()}>
        <div className="settings-header">
          <h3>設定</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="setting-row">
          <span className="setting-label">語速</span>
          <div className="setting-control">
            <span className="setting-value">{settings.speechRate.toFixed(1)}x</span>
            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.1"
              value={settings.speechRate}
              onChange={e => updateSetting('speechRate', parseFloat(e.target.value))}
            />
          </div>
        </div>

        <div className="setting-row">
          <span className="setting-label">自動朗讀</span>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={settings.autoSpeak}
              onChange={e => updateSetting('autoSpeak', e.target.checked)}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
      </div>
    </div>
  )
}
