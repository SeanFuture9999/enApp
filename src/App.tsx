import { useState } from 'react'
import QuizScreen from './components/QuizScreen'
import RecordsScreen from './components/RecordsScreen'
import './App.css'

type Screen = 'quiz' | 'records'

function App() {
  const [screen, setScreen] = useState<Screen>('quiz')

  return (
    <div className="app">
      {screen === 'quiz' && (
        <QuizScreen onNavigateRecords={() => setScreen('records')} />
      )}
      {screen === 'records' && (
        <RecordsScreen onBack={() => setScreen('quiz')} />
      )}
    </div>
  )
}

export default App
