import { useState } from 'react'

import { AuthLayout } from './components/AuthLayout'
import { DashboardPage } from './pages/DashboardPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { LoginPage } from './pages/LoginPages'
import { RegisterPage } from './pages/RegisterPage'
import './App.css'

function App() {
  const [mode, setMode] = useState('login')
  const [currentUser, setCurrentUser] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  if (currentUser) {
    return (
      <DashboardPage
        currentUser={currentUser}
        key={refreshKey}
        onLogout={() => setCurrentUser(null)}
      />
    )
  }

  return (
    <AuthLayout mode={mode} onModeChange={setMode}>
      {mode === 'login' && <LoginPage onLogin={setCurrentUser} />}
      {mode === 'register' && <RegisterPage onCreated={() => setRefreshKey((value) => value + 1)} />}
      {mode === 'forgot' && <ForgotPasswordPage />}
    </AuthLayout>
  )
}

export default App
