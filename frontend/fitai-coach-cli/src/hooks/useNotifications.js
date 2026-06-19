import { useCallback, useState } from 'react'

export function useNotifications() {
  const [notifications, setNotifications] = useState([])

  const dismiss = useCallback((id) => {
    setNotifications((current) => current.filter((notification) => notification.id !== id))
  }, [])

  const notify = useCallback((message, type = 'success') => {
    const id = crypto.randomUUID()
    setNotifications((current) => [...current, { id, message, type }])
    window.setTimeout(() => dismiss(id), 4200)
  }, [dismiss])

  return { notifications, notify, dismiss }
}
