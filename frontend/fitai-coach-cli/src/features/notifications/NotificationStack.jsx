export function NotificationStack({ notifications, onDismiss }) {
  if (notifications.length === 0) {
    return null
  }

  return (
    <div className="notification-stack" role="status" aria-live="polite">
      {notifications.map((notification) => (
        <div className={`notification notification-${notification.type}`} key={notification.id}>
          <span>{notification.message}</span>
          <button type="button" onClick={() => onDismiss(notification.id)} aria-label="Cerrar notificacion">
            Cerrar
          </button>
        </div>
      ))}
    </div>
  )
}
