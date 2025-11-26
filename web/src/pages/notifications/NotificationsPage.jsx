import { useEffect, useState } from 'react'
import { NotificationItem } from '../../components/cards/NotificationItem.jsx'
import { EmptyState } from '../../components/common/EmptyState.jsx'
import { Loader } from '../../components/common/Loader.jsx'
import { PageHeader } from '../../components/common/PageHeader.jsx'
import { useApiMutation, useApiQuery } from '../../hooks/useApi.js'
import { apiFetch } from '../../utils/apiClient.js'
import { getSocket, socketEvents } from '../../utils/socket.js'

export const NotificationsPage = () => {
  const socket = getSocket()
  const [filter, setFilter] = useState({ unreadOnly: false, type: '' })
  
  const notificationsQuery = useApiQuery('/notifications', {
    params: {
      limit: 50,
      page: 1,
      ...(filter.unreadOnly && { unreadOnly: 'true' }),
      ...(filter.type && { type: filter.type })
    }
  })

  const markOneMutation = useApiMutation(async ({ token, variables }) => {
    if (!token) throw new Error('No auth')
    return apiFetch(`/notifications/${variables}/read`, { method: 'PATCH', token })
  })

  const markAllMutation = useApiMutation('/notifications/read/all', {
    method: 'PUT',
    onSuccess: () => notificationsQuery.refetch()
  })

  const deleteMutation = useApiMutation(async ({ token, variables }) => {
    if (!token) throw new Error('No auth')
    return apiFetch(`/notifications/${variables}`, { method: 'DELETE', token })
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

  const handleDelete = async (notificationId) => {
    try {
      await deleteMutation.mutateAsync(notificationId)
      notificationsQuery.refetch()
    } catch (err) {
      console.error(err)
    }
  }

  const unreadCount = notificationsQuery.data?.data?.filter(n => !n.read).length || 0
  const notifications = notificationsQuery.data?.data || []

  const actions = (
    <div className="flex items-center gap-3">
      <select
        className="rounded-2xl border border-border/70 bg-white/80 px-3 py-2 text-sm font-medium text-slate-600 shadow-inner outline-none"
        value={filter.type}
        onChange={(e) => setFilter({ ...filter, type: e.target.value })}
      >
        <option value="">All types</option>
        <option value="SCHEDULE_CREATED">Schedule Created</option>
        <option value="SCHEDULE_UPDATED">Schedule Updated</option>
        <option value="SCHEDULE_DELETED">Schedule Deleted</option>
        <option value="NEW_ANNOUNCEMENT">Announcements</option>
        <option value="SYSTEM">System</option>
      </select>
      <button
        className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition ${
          filter.unreadOnly
            ? 'border-brand-500 bg-brand-500 text-white'
            : 'border-border/70 bg-white/80 text-slate-600'
        }`}
        type="button"
        onClick={() => setFilter({ ...filter, unreadOnly: !filter.unreadOnly })}
      >
        {filter.unreadOnly ? 'Show All' : 'Unread Only'}
      </button>
      {unreadCount > 0 && (
        <button
          className="rounded-2xl border border-brand-300 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-600 transition hover:bg-brand-100"
          type="button"
          onClick={() => markAllMutation.mutateAsync()}
          disabled={markAllMutation.isPending}
        >
          {markAllMutation.isPending ? 'Marking…' : 'Mark all read'}
        </button>
      )}
    </div>
  )

  return (
    <div>
      <PageHeader 
        title="Notifications" 
        subtitle={`${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`}
        actions={actions} 
      />

      {notificationsQuery.isLoading ? (
        <Loader label="Loading notifications" />
      ) : notifications.length > 0 ? (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <NotificationItem 
              key={notification.id} 
              notification={notification} 
              onMarkRead={handleMarkRead}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <EmptyState description="Silence. Treasure it." />
      )}
    </div>
  )
}
