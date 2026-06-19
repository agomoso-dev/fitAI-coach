import { useState } from 'react'

import { NotificationStack } from '../../features/notifications/NotificationStack'
import { useNotifications } from '../../hooks/useNotifications'
import { createUser } from '../../services/api'
import { getFriendlyError } from '../../utils/errors'

const emptyForm = {
  email: '',
  password: '',
  first_name: '',
  last_name: '',
  role: 'athlete',
  age: '',
  sex: 'unknown',
  height_cm: '',
  weight_kg: '',
  daily_physical_effort: 'moderate',
  training_experience_months: '',
  training_goal: '',
  medical_notes: '',
}

function hasStrongPassword(password) {
  return password.length >= 8 && /[A-Z]/.test(password) && /[^A-Za-z0-9]/.test(password)
}

function cleanPayload(form) {
  return Object.fromEntries(
    Object.entries(form).map(([key, value]) => [key, value === '' ? null : value]),
  )
}

export function RegisterPage({ onCreated }) {
  const [form, setForm] = useState(emptyForm)
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const { notifications, notify, dismiss } = useNotifications()

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  async function submit(event) {
    event.preventDefault()
    setLoading(true)
    setStatus('')

    try {
      if (!hasStrongPassword(form.password)) {
        setStatus('La contrasena debe tener 8 caracteres, una mayuscula y un caracter especial.')
        return
      }

      await createUser(cleanPayload(form))
      setForm(emptyForm)
      notify('Usuario creado. Se ha enviado un correo de confirmacion a su email.', 'success')
      onCreated?.()
    } catch (error) {
      setStatus(getFriendlyError(error))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="stack-form" onSubmit={submit}>
      <NotificationStack notifications={notifications} onDismiss={dismiss} />

      <header>
        <h2>Crear usuario</h2>
        <p>Alta inicial sobre la tabla users del schema PostgreSQL.</p>
      </header>

      <label>
        Correo
        <input name="email" type="email" value={form.email} onChange={updateField} required />
      </label>

      <label>
        Contrasena
        <input
          name="password"
          type="password"
          value={form.password}
          onChange={updateField}
          minLength="8"
          pattern="(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}"
          title="Minimo 8 caracteres, una mayuscula y un caracter especial"
          required
        />
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

      <div className="form-grid">
        <label>
          Edad
          <input name="age" type="number" min="12" max="100" value={form.age} onChange={updateField} />
        </label>

        <label>
          Sexo
          <select name="sex" value={form.sex} onChange={updateField}>
            <option value="unknown">Prefiero no decirlo</option>
            <option value="male">Hombre</option>
            <option value="female">Mujer</option>
            <option value="other">Otro</option>
          </select>
        </label>

        <label>
          Altura (cm)
          <input name="height_cm" type="number" min="80" max="250" step="0.01" value={form.height_cm} onChange={updateField} />
        </label>

        <label>
          Peso (kg)
          <input name="weight_kg" type="number" min="25" max="300" step="0.01" value={form.weight_kg} onChange={updateField} />
        </label>
      </div>

      <label>
        Esfuerzo fisico diario
        <select name="daily_physical_effort" value={form.daily_physical_effort} onChange={updateField}>
          <option value="low">Bajo</option>
          <option value="moderate">Moderado</option>
          <option value="high">Alto</option>
          <option value="very_high">Muy alto</option>
        </select>
      </label>

      <label>
        Experiencia entrenando (meses)
        <input name="training_experience_months" type="number" min="0" value={form.training_experience_months} onChange={updateField} />
      </label>

      <label>
        Objetivo principal
        <input name="training_goal" value={form.training_goal} onChange={updateField} placeholder="Fuerza, hipertrofia, perdida de grasa..." />
      </label>

      <label>
        Notas medicas o lesiones
        <textarea name="medical_notes" value={form.medical_notes} onChange={updateField} rows="3" />
      </label>

      <button type="submit" disabled={loading}>
        {loading ? 'Creando...' : 'Crear usuario'}
      </button>

      {status && <p className="status">{status}</p>}
    </form>
  )
}
