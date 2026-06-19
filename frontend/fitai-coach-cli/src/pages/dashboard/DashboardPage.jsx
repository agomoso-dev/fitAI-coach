import { useEffect, useState } from 'react'

import { NotificationStack } from '../../features/notifications/NotificationStack'
import { useNotifications } from '../../hooks/useNotifications'
import { adminCreateUser, deleteUser, listPasswordResetRequests, listUsers, updateUser } from '../../services/api'
import { getFriendlyError } from '../../utils/errors'

const emptyNewUser = {
  email: '',
  password: '',
  first_name: '',
  last_name: '',
  role: 'athlete',
}

function cleanPayload(payload) {
  return Object.fromEntries(Object.entries(payload).map(([key, value]) => [key, value === '' ? null : value]))
}

export function DashboardPage({ currentUser, onLogout }) {
  const [users, setUsers] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [newUserForm, setNewUserForm] = useState(emptyNewUser)
  const [resetRequests, setResetRequests] = useState([])
  const [activeTab, setActiveTab] = useState('users')
  const [status, setStatus] = useState('')
  const { notifications, notify, dismiss } = useNotifications()
  const isAdmin = currentUser.role === 'admin'

  async function loadUsers() {
    try {
      setUsers(await listUsers())
    } catch (error) {
      setStatus(getFriendlyError(error))
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  useEffect(() => {
    if (isAdmin) {
      loadResetRequests()
    }
  }, [isAdmin])

  async function loadResetRequests() {
    try {
      setResetRequests(await listPasswordResetRequests(currentUser))
    } catch (error) {
      setStatus(getFriendlyError(error))
    }
  }

  function startEdit(user) {
    setEditingId(user.id)
    setEditForm({
      email: user.email ?? '',
      first_name: user.first_name ?? '',
      last_name: user.last_name ?? '',
      role: user.role ?? 'athlete',
      age: user.age ?? '',
      daily_physical_effort: user.daily_physical_effort ?? 'moderate',
      training_goal: user.training_goal ?? '',
    })
  }

  function updateEditField(event) {
    const { name, value } = event.target
    setEditForm((current) => ({ ...current, [name]: value }))
  }

  function updateNewUserField(event) {
    const { name, value } = event.target
    setNewUserForm((current) => ({ ...current, [name]: value }))
  }

  async function createAdminUser(event) {
    event.preventDefault()
    setStatus('')

    try {
      await adminCreateUser(cleanPayload(newUserForm), currentUser)
      setNewUserForm(emptyNewUser)
      notify('Usuario creado correctamente', 'success')
      await loadUsers()
    } catch (error) {
      notify(getFriendlyError(error), 'error')
    }
  }

  async function saveEdit(event) {
    event.preventDefault()
    setStatus('')

    try {
      await updateUser(editingId, cleanPayload(editForm), currentUser)
      setEditingId(null)
      notify('Usuario actualizado correctamente', 'success')
      await loadUsers()
    } catch (error) {
      notify(getFriendlyError(error), 'error')
    }
  }

  async function removeUser(user) {
    if (user.id === currentUser.id) {
      setStatus('No puedes eliminar tu propio usuario mientras tienes la sesion iniciada.')
      return
    }

    if (!window.confirm(`Eliminar definitivamente a ${user.email}?`)) {
      return
    }

    try {
      await deleteUser(user.id, currentUser)
      notify('Usuario eliminado correctamente', 'success')
      await loadUsers()
    } catch (error) {
      notify(getFriendlyError(error), 'error')
    }
  }

  return (
    <main className="dashboard-shell">
      <NotificationStack notifications={notifications} onDismiss={dismiss} />

      <header className="topbar">
        <div>
          <p className="eyebrow">Sesion iniciada</p>
          <h1>{currentUser.email}</h1>
        </div>
        <button type="button" onClick={onLogout}>
          Cerrar sesion
        </button>
      </header>

      <section className="panel">
        <header className="section-header">
          <p>Base de datos</p>
          <h2>Usuarios registrados</h2>
        </header>

        {isAdmin && (
          <nav className="dashboard-tabs" aria-label="Administracion">
            <button className={activeTab === 'users' ? 'active' : ''} type="button" onClick={() => setActiveTab('users')}>
              Usuarios
            </button>
            <button className={activeTab === 'resets' ? 'active' : ''} type="button" onClick={() => setActiveTab('resets')}>
              Recuperaciones
            </button>
          </nav>
        )}

        {isAdmin && activeTab === 'users' && (
          <form className="create-user-form" onSubmit={createAdminUser}>
            <input name="email" type="email" value={newUserForm.email} onChange={updateNewUserField} placeholder="Email" required />
            <input
              name="password"
              type="password"
              value={newUserForm.password}
              onChange={updateNewUserField}
              placeholder="Contrasena"
              minLength="8"
              required
            />
            <input name="first_name" value={newUserForm.first_name} onChange={updateNewUserField} placeholder="Nombre" />
            <input name="last_name" value={newUserForm.last_name} onChange={updateNewUserField} placeholder="Apellidos" />
            <select name="role" value={newUserForm.role} onChange={updateNewUserField}>
              <option value="athlete">Athlete</option>
              <option value="coach">Coach</option>
              <option value="admin">Admin</option>
            </select>
            <button type="submit">Agregar usuario</button>
          </form>
        )}

        {activeTab === 'users' && <div className="user-list">
          {users.length === 0 ? (
            <p className="empty-state">Sin usuarios registrados.</p>
          ) : (
            users.map((user) => (
              <article className="user-row" key={user.id}>
                {editingId === user.id ? (
                  <form className="edit-user-form" onSubmit={saveEdit}>
                    <input name="email" type="email" value={editForm.email} onChange={updateEditField} required />
                    <input name="first_name" value={editForm.first_name} onChange={updateEditField} placeholder="Nombre" />
                    <input name="last_name" value={editForm.last_name} onChange={updateEditField} placeholder="Apellidos" />
                    <select name="role" value={editForm.role} onChange={updateEditField}>
                      <option value="athlete">Athlete</option>
                      <option value="coach">Coach</option>
                      <option value="admin">Admin</option>
                    </select>
                    <input name="age" type="number" min="12" max="100" value={editForm.age} onChange={updateEditField} placeholder="Edad" />
                    <select name="daily_physical_effort" value={editForm.daily_physical_effort} onChange={updateEditField}>
                      <option value="low">Bajo</option>
                      <option value="moderate">Moderado</option>
                      <option value="high">Alto</option>
                      <option value="very_high">Muy alto</option>
                    </select>
                    <input name="training_goal" value={editForm.training_goal} onChange={updateEditField} placeholder="Objetivo" />
                    <div className="row-actions">
                      <button type="submit">Guardar</button>
                      <button className="secondary-button" type="button" onClick={() => setEditingId(null)}>
                        Cancelar
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div>
                      <strong>{user.email}</strong>
                      <span>
                        {[user.first_name, user.last_name].filter(Boolean).join(' ') || 'Sin nombre'} - {user.role}
                      </span>
                      <span>
                        Edad: {user.age ?? 'sin dato'} - Esfuerzo: {user.daily_physical_effort ?? 'sin dato'} - Objetivo:{' '}
                        {user.training_goal || 'sin dato'}
                      </span>
                    </div>
                    {isAdmin && (
                      <div className="row-actions">
                        <button type="button" onClick={() => startEdit(user)}>
                          Editar
                        </button>
                        <button className="danger-button" type="button" onClick={() => removeUser(user)}>
                          Eliminar
                        </button>
                      </div>
                    )}
                  </>
                )}
              </article>
            ))
          )}
        </div>}

        {isAdmin && activeTab === 'resets' && (
          <div className="user-list">
            {resetRequests.length === 0 ? (
              <p className="empty-state">Sin solicitudes de recuperacion.</p>
            ) : (
              resetRequests.map((request) => (
                <article className="user-row" key={request.id}>
                  <div>
                    <strong>{request.user_email}</strong>
                    <span>
                      {[request.user_first_name, request.user_last_name].filter(Boolean).join(' ') || 'Sin nombre'} - {request.user_role}
                    </span>
                    <span>
                      Solicitado: {new Date(request.requested_at).toLocaleString()} - Caduca:{' '}
                      {new Date(request.expires_at).toLocaleString()} - {request.is_used ? 'Usado' : 'Pendiente'}
                    </span>
                    <a href={request.reset_url} target="_blank" rel="noreferrer">
                      {request.reset_url}
                    </a>
                  </div>
                </article>
              ))
            )}
          </div>
        )}

        {status && <p className="status error">{status}</p>}
      </section>
    </main>
  )
}
