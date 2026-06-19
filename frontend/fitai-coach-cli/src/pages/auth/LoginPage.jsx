import { useState } from 'react'

import { login } from '../../services/api'
import { getLoginError } from '../../utils/errors'

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
      setStatus(getLoginError(error))
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
        Correo
        <input name="email" value={form.email} onChange={updateField} required />
      </label>

      <label>
        Contraseña
        <input name="password" type="password" value={form.password} onChange={updateField} required />
      </label>

      <button type="submit" disabled={loading}>
        {loading ? 'Validando...' : 'Entrar'}
      </button>

      {status && <div className="form-alert error">{status}</div>}
    </form>
  )
}
