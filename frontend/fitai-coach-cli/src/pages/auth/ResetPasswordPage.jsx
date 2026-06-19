import { useState } from 'react'

import { confirmPasswordReset } from '../../services/api'

function hasStrongPassword(password) {
  return password.length >= 8 && /[A-Z]/.test(password) && /[^A-Za-z0-9]/.test(password)
}

export function ResetPasswordPage({ token, onFinished }) {
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setLoading(true)
    setStatus('')

    try {
      if (!hasStrongPassword(password)) {
        setStatus('La contraseña debe tener 8 caracteres, una mayuscula y un caracter especial.')
        return
      }

      const response = await confirmPasswordReset({ token, password })
      setStatus(response.detail)
      window.history.replaceState({}, '', window.location.pathname)
      onFinished?.()
    } catch (error) {
      setStatus(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="stack-form" onSubmit={submit}>
      <header>
        <h2>Nueva contraseña</h2>
        <p>Define una contraseña nueva para recuperar el acceso.</p>
      </header>

      <label>
        Nueva contraseña
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          minLength="8"
          pattern="(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}"
          title="Minimo 8 caracteres, una mayuscula y un caracter especial"
          required
        />
      </label>

      <button type="submit" disabled={loading}>
        {loading ? 'Actualizando...' : 'Cambiar contraseña'}
      </button>

      {status && <p className="status">{status}</p>}
    </form>
  )
}
