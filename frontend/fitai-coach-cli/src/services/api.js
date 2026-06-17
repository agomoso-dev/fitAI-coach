const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api'

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
    ...options,
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(data ? JSON.stringify(data) : 'Error de API')
  }

  return data
}

export function createUser(payload) {
  return request('/users/', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function listUsers() {
  return request('/users/')
}

export function login(payload) {
  return request('/auth/login/', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function requestPasswordReset(payload) {
  return request('/auth/password-reset/', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
