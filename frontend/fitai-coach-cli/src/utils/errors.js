export function getFriendlyError(error, fallback = 'Ha ocurrido un error. Intentalo de nuevo.') {
  if (!error?.message) {
    return fallback
  }

  try {
    const parsed = JSON.parse(error.message)
    const values = Object.values(parsed).flat()
    if (values.length > 0) {
      return String(values[0])
    }
  } catch {
    return error.message === 'Failed to fetch' ? 'No se pudo conectar con el servidor.' : error.message
  }

  return fallback
}

export function getLoginError(error) {
  const message = getFriendlyError(error, 'No se pudo iniciar sesion.')
  if (message.toLowerCase().includes('credenciales')) {
    return 'Email o contraseña incorrectos. Revisa los datos e intentalo otra vez.'
  }
  return message
}
