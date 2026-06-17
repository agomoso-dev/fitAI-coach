import { useState } from 'react'

import { login } from '../services/api'

export function LoginPage({ onLogin }) {
  const [form, setForm] = useState({ email: '', password: '' })
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  async function submit(event) {
    event.preventDefault()
    setLoading(true)
    setStatus('')

    try {
      const user = await login(form)
      onLogin(user)
    } catch (error) {
      setStatus(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="stack-form" onSubmit={submit}>
      <header>
        <h2>Iniciar sesion</h2>
        <p>Acceso para atletas, entrenadores y administradores.</p>
      </header>

      <label>
        Email
        <input name="email" type="email" value={form.email} onChange={updateField} required />
      </label>

      <label>
        Password
        <input name="password" type="password" value={form.password} onChange={updateField} required />
      </label>

      <button type="submit" disabled={loading}>
        {loading ? 'Validando...' : 'Entrar'}
      </button>

      {status && <p className="status error">{status}</p>}
    </form>
  )
}
