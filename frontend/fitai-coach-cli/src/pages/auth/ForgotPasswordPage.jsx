import { useState } from 'react'

import { requestPasswordReset } from '../../services/api'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setLoading(true)
    setStatus('')

    try {
      const response = await requestPasswordReset({ email })
      setStatus(response.detail)
    } catch (error) {
      setStatus(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="stack-form" onSubmit={submit}>
      <header>
        <h2>Recuperar password</h2>
        <p>Base preparada para conectar envio de email o token temporal.</p>
      </header>

      <label>
        Email
        <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
      </label>

      <button type="submit" disabled={loading}>
        {loading ? 'Enviando...' : 'Solicitar recuperacion'}
      </button>

      {status && <p className="status">{status}</p>}
    </form>
  )
}
