import { useState } from 'react'

import { createUser } from '../services/api'

const emptyForm = {
  email: '',
  password: '',
  first_name: '',
  last_name: '',
  role: 'athlete',
}

export function RegisterPage({ onCreated }) {
  const [form, setForm] = useState(emptyForm)
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
      await createUser(form)
      setForm(emptyForm)
      setStatus('Usuario creado correctamente')
      onCreated?.()
    } catch (error) {
      setStatus(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="stack-form" onSubmit={submit}>
      <header>
        <h2>Crear usuario</h2>
        <p>Alta inicial sobre la tabla users del schema PostgreSQL.</p>
      </header>

      <label>
        Email
        <input name="email" type="email" value={form.email} onChange={updateField} required />
      </label>

      <label>
        Password
        <input name="password" type="password" value={form.password} onChange={updateField} minLength="8" required />
      </label>

      <label>
        Nombre
        <input name="first_name" value={form.first_name} onChange={updateField} />
      </label>

      <label>
        Apellidos
        <input name="last_name" value={form.last_name} onChange={updateField} />
      </label>

      <label>
        Rol
        <select name="role" value={form.role} onChange={updateField}>
          <option value="athlete">Athlete</option>
          <option value="coach">Coach</option>
          <option value="admin">Admin</option>
        </select>
      </label>

      <button type="submit" disabled={loading}>
        {loading ? 'Creando...' : 'Crear usuario'}
      </button>

      {status && <p className="status">{status}</p>}
    </form>
  )
}
