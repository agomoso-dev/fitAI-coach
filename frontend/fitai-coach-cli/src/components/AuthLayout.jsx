export function AuthLayout({ children, mode, onModeChange }) {
  return (
    <main className="auth-shell">
      <section className="brand-panel">
        <p className="eyebrow">FitAI Coach</p>
        <h1>Training RTS AI</h1>
        <p className="brand-copy">Gestion de atletas, entrenadores y planificacion basada en RPE.</p>
      </section>

      <section className="auth-panel">
        <nav className="auth-tabs" aria-label="Auth navigation">
          <button className={mode === 'login' ? 'active' : ''} type="button" onClick={() => onModeChange('login')}>
            Iniciar sesion
          </button>
          <button className={mode === 'register' ? 'active' : ''} type="button" onClick={() => onModeChange('register')}>
            Crear usuario
          </button>
          <button className={mode === 'forgot' ? 'active' : ''} type="button" onClick={() => onModeChange('forgot')}>
            Recuperar
          </button>
        </nav>
        {children}
      </section>
    </main>
  )
}
