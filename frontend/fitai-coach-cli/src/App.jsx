import { useState } from 'react'

import { AuthLayout } from './components/AuthLayout'
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage'
import { LoginPage } from './pages/auth/LoginPage'
import { RegisterPage } from './pages/auth/RegisterPage'
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage'
import { DashboardPage } from './pages/dashboard/DashboardPage'
import './App.css'

function App() {
  const initialResetToken = new URLSearchParams(window.location.search).get('resetToken')
  const [mode, setMode] = useState(initialResetToken ? 'reset' : 'home')
  const [resetToken] = useState(initialResetToken)
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
      {mode === 'reset' && <ResetPasswordPage token={resetToken} onFinished={() => setMode('login')} />}
    </AuthLayout>
  )
}

export default App
