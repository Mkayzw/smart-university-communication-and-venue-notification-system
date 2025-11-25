import { useEffect } from 'react'
import { NotificationItem } from '../../components/cards/NotificationItem.jsx'
import { EmptyState } from '../../components/common/EmptyState.jsx'
import { Loader } from '../../components/common/Loader.jsx'
import { PageHeader } from '../../components/common/PageHeader.jsx'
import { useApiMutation, useApiQuery } from '../../hooks/useApi.js'
import { apiFetch } from '../../utils/apiClient.js'
import { getSocket, socketEvents } from '../../utils/socket.js'

export const NotificationsPage = () => {
  const socket = getSocket()
  const notificationsQuery = useApiQuery('/notifications', {
    params: { limit: 20, page: 1 }
  })

  const markOneMutation = useApiMutation(async ({ token, variables }) => {
    if (!token) throw new Error('No auth')
    return apiFetch(`/notifications/${variables}/read`, { method: 'PUT', token })
  })

  const markAllMutation = useApiMutation('/notifications/read-all', {
    method: 'PUT',
    onSuccess: () => notificationsQuery.refetch()
  })

  useEffect(() => {
    if (!socket) return

    const handleNewNotification = (notification) => {
      console.log('New notification received:', notification)
      notificationsQuery.refetch()
    }

    socket.on(socketEvents.NOTIFICATION, handleNewNotification)

    return () => {
      socket.off(socketEvents.NOTIFICATION, handleNewNotification)
    }
  }, [socket, notificationsQuery])

  const handleMarkRead = async (notificationId) => {
    try {
      await markOneMutation.mutateAsync(notificationId)
      notificationsQuery.refetch()
    } catch (err) {
      console.error(err)
    }
  }

  const actions = (
    <button
      className="rounded-2xl border border-brand-300 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-600 transition hover:bg-brand-100"
      type="button"
      onClick={() => markAllMutation.mutateAsync()}
      disabled={markAllMutation.isPending}
    >
      {markAllMutation.isPending ? 'Marking…' : 'Mark all read'}
    </button>
  )

  return (
    <div>
      <PageHeader title="Notifications" subtitle="All pings from the system." actions={actions} />

      {notificationsQuery.isLoading ? (
        <Loader label="Loading notifications" />
      ) : notificationsQuery.data?.data?.length ? (
        <div className="space-y-3">
          {notificationsQuery.data.data.map((notification) => (
            <NotificationItem key={notification.id} notification={notification} onMarkRead={handleMarkRead} />
          ))}
        </div>
      ) : (
        <EmptyState description="Silence. Treasure it." />
      )}
    </div>
  )
}
