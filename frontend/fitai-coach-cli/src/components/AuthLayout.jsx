import { useEffect, useState } from 'react'

import { getSportsFeed } from '../services/api'

const defaultFeed = {
  headline: 'Entrena con criterio antes de abrir tu plan',
  intro: 'Planifica tu entrenamiento, mejora tus habitos y sigue el deporte que te interesa.',
  coach_note: 'Noticias tomadas de periodicos deportivos. La IA solo las reescribe y ordena segun tus intereses.',
  featured_topic: 'Deporte',
  cards: [
    {
      title: 'Cargando titulares deportivos',
      summary: 'Estamos conectando con las fuentes deportivas para preparar la portada.',
      tag: 'Deporte',
      source: 'FitAI Coach',
      url: '#',
      read_minutes: 1,
    },
  ],
}

function readInterests() {
  try {
    return JSON.parse(localStorage.getItem('fitai:sport-interests')) ?? {}
  } catch {
    return {}
  }
}

function saveInterest(tag) {
  const key = tag.toLowerCase()
  const interests = readInterests()
  const visits = Array.isArray(interests.visits) ? interests.visits : []
  const next = {
    ...interests,
    [key]: (interests[key] ?? 0) + 1,
    visits: [
      { topic: key, visited_at: Date.now() / 1000 },
      ...visits,
    ].slice(0, 80),
  }
  localStorage.setItem('fitai:sport-interests', JSON.stringify(next))
  return next
}

export function AuthLayout({ children, mode, onModeChange }) {
  const [feed, setFeed] = useState(defaultFeed)

  useEffect(() => {
    let active = true

    getSportsFeed(readInterests())
      .then((data) => {
        if (active) {
          setFeed({ ...defaultFeed, ...data, cards: data.cards?.length ? data.cards : defaultFeed.cards })
        }
      })
      .catch(() => setFeed(defaultFeed))

    return () => {
      active = false
    }
  }, [])

  function trackCard(card) {
    const nextInterests = saveInterest(card.tag)
    getSportsFeed(nextInterests)
      .then((data) => setFeed({ ...defaultFeed, ...data, cards: data.cards?.length ? data.cards : feed.cards }))
      .catch(() => {})

    if (card.url && card.url !== '#') {
      window.open(card.url, '_blank', 'noreferrer')
    }
  }

  function openRegister() {
    onModeChange('register')
  }

  return (
    <main className="home-shell">
      <nav className="home-topbar">
        <button className="brand-mark" type="button" onClick={() => onModeChange('home')}>
          <span>FitAI</span>
          <strong>Coach</strong>
        </button>

        <div className="home-links">
          <button type="button" onClick={() => onModeChange('login')}>Acceder</button>
        </div>
      </nav>

      <section className="home-hero">
        <div className="hero-copy">
          <h1>{feed.headline}</h1>
          <p>{feed.intro}</p>
          <button type="button" onClick={openRegister}>Entrar al planificador</button>
        </div>
      </section>

      <section className="content-band">
        <header className="section-header">
          <p>PERIODICOS deportivos</p>
          <h2>NOTICIAS ACTUALES</h2>
        </header>

        <div className="story-grid">
          {feed.cards.map((card) => (
            <article className="story-card" key={card.title} onClick={() => trackCard(card)}>
              <span>{card.tag}</span>
              <h3>{card.title}</h3>
              <p>{card.summary}</p>
              <small>
                {card.source} - {card.read_minutes} min aprox.
              </small>
            </article>
          ))}
        </div>
      </section>

      {mode !== 'home' && (
        <section className="auth-overlay" aria-label="Acceso FitAI Coach">
          <div className="auth-dialog">
            <header className="auth-brand">
              <button type="button" onClick={() => onModeChange('home')}>Inicio</button>
              <strong>FitAI Coach</strong>
            </header>

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
          </div>
        </section>
      )}
    </main>
  )
}
