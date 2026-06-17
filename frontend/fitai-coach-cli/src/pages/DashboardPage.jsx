import { useEffect, useState } from 'react'

import { listUsers } from '../services/api'

export function DashboardPage({ currentUser, onLogout }) {
  const [users, setUsers] = useState([])
  const [status, setStatus] = useState('')

  async function loadUsers() {
    try {
      setUsers(await listUsers())
    } catch (error) {
      setStatus(error.message)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  return (
    <main className="dashboard-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Sesion iniciada</p>
          <h1>{currentUser.email}</h1>
        </div>
        <button type="button" onClick={onLogout}>
          Salir
        </button>
      </header>

      <section className="panel">
        <header className="section-header">
          <p>Base de datos</p>
          <h2>Usuarios registrados</h2>
        </header>

        <div className="user-list">
          {users.length === 0 ? (
            <p className="empty-state">Sin usuarios registrados.</p>
          ) : (
            users.map((user) => (
              <article className="user-row" key={user.id}>
                <div>
                  <strong>{user.email}</strong>
                  <span>
                    {[user.first_name, user.last_name].filter(Boolean).join(' ') || 'Sin nombre'} · {user.role}
                  </span>
                </div>
              </article>
            ))
          )}
        </div>

        {status && <p className="status error">{status}</p>}
      </section>
    </main>
  )
}
