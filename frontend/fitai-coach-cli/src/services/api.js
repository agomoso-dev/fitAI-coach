const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api'
const AI_URL = import.meta.env.VITE_AI_URL ?? 'http://localhost:5005'

async function request(path, options = {}) {
  let response

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
    })
  } catch (error) {
    throw new Error('No se pudo conectar con la API. Revisa que el backend este activo y que CORS permita la peticion.')
  }

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

export function adminCreateUser(payload, currentUser) {
  return request('/users/', {
    method: 'POST',
    headers: { 'X-User-Role': currentUser.role },
    body: JSON.stringify(payload),
  })
}

export function listUsers() {
  return request('/users/')
}

export function updateUser(id, payload, currentUser) {
  return request(`/users/${id}/`, {
    method: 'PATCH',
    headers: { 'X-User-Role': currentUser.role },
    body: JSON.stringify(payload),
  })
}

export function deleteUser(id, currentUser) {
  return request(`/users/${id}/`, {
    method: 'DELETE',
    headers: { 'X-User-Role': currentUser.role },
  })
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

export function confirmPasswordReset(payload) {
  return request('/auth/password-reset/confirm/', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function listPasswordResetRequests(currentUser) {
  return request('/admin/password-reset-requests/', {
    headers: { 'X-User-Role': currentUser.role },
  })
}

export async function getSportsFeed(interests) {
  const response = await fetch(`${AI_URL}/sports-feed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ interests }),
  })

  if (!response.ok) {
    throw new Error('No se pudo cargar la portada inteligente')
  }

  return response.json()
}
