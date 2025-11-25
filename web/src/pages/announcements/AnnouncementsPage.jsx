import { useState, useEffect } from 'react'
import { AnnouncementCard } from '../../components/cards/AnnouncementCard.jsx'
import { EmptyState } from '../../components/common/EmptyState.jsx'
import { Loader } from '../../components/common/Loader.jsx'
import { PageHeader } from '../../components/common/PageHeader.jsx'
import { Modal } from '../../components/common/Modal.jsx'
import AnnouncementForm from '../../components/forms/AnnouncementForm.jsx'
import { useApiQuery, useApiMutation } from '../../hooks/useApi.js'
import { useAuth } from '../../hooks/useAuth.js'
import { getSocket, socketEvents } from '../../utils/socket.js'

const audiences = [
  { value: 'ALL', label: 'All audiences' },
  { value: 'STUDENTS', label: 'Students' },
  { value: 'LECTURERS', label: 'Lecturers' }
]

export const AnnouncementsPage = () => {
  const { user } = useAuth()
  const socket = getSocket()
  const [filters, setFilters] = useState({ search: '', targetAudience: 'ALL', pinned: '' })
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const announcementsQuery = useApiQuery('/announcements', {
    params: {
      limit: 12,
      page: 1,
      search: filters.search || undefined,
      targetAudience: filters.targetAudience === 'ALL' ? undefined : filters.targetAudience,
      pinned: filters.pinned || undefined
    }
  })

  useEffect(() => {
    if (!socket) return

    const handleNewAnnouncement = (announcement) => {
      console.log('New announcement received:', announcement)
      announcementsQuery.refetch()
    }

    socket.on(socketEvents.NEW_ANNOUNCEMENT, handleNewAnnouncement)

    return () => {
      socket.off(socketEvents.NEW_ANNOUNCEMENT, handleNewAnnouncement)
    }
  }, [socket, announcementsQuery])

  const createMutation = useApiMutation('/announcements', {
    method: 'POST',
    onSuccess: () => {
      setIsCreateModalOpen(false)
      announcementsQuery.refetch()
    }
  })

  const handleCreate = (data) => {
    createMutation.mutate(data)
  }

  const canCreateAnnouncement = user?.role === 'LECTURER' || user?.role === 'ADMIN'

  const actions = (
    <div className="flex flex-wrap items-center gap-3">
      {canCreateAnnouncement && (
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="rounded-2xl  bg-brand-500  px-4 py-2 text-sm font-medium text-white shadow-md"
        >
          + Create Announcement
        </button>
      )}
      <select
        className="rounded-2xl border border-border/70 bg-white/80 px-4 py-2 text-sm font-medium text-slate-600 shadow-inner outline-none"
        value={filters.targetAudience}
        onChange={(event) => setFilters((prev) => ({ ...prev, targetAudience: event.target.value }))}
      >
        {audiences.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <select
        className="rounded-2xl border border-border/70 bg-white/80 px-4 py-2 text-sm font-medium text-slate-600 shadow-inner outline-none"
        value={filters.pinned}
        onChange={(event) => setFilters((prev) => ({ ...prev, pinned: event.target.value }))}
      >
        <option value="">All status</option>
        <option value="true">Only pinned</option>
        <option value="false">Unpinned</option>
      </select>
      <input
        className="w-full rounded-2xl border border-border/70 bg-white/80 px-4 py-2 text-sm font-medium text-slate-600 shadow-inner outline-none md:w-64"
        placeholder="Search announcements"
        value={filters.search}
        onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
      />
    </div>
  )

  return (
    <div>
      <PageHeader title="Announcements" subtitle="All the campus noise, neatly packaged." actions={actions} />

      {announcementsQuery.isLoading ? (
        <Loader label="Fetching announcements" />
      ) : announcementsQuery.data?.data?.length ? (
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {announcementsQuery.data.data.map((announcement) => (
            <AnnouncementCard 
              key={announcement.id} 
              announcement={announcement}
              onUpdate={announcementsQuery.refetch}
            />
          ))}
        </div>
      ) : (
        <EmptyState description="No one said anything yet. Must be exam week." />
      )}

      {isCreateModalOpen && (
        <Modal
          title="Create Announcement"
          onClose={() => setIsCreateModalOpen(false)}
        >
          <AnnouncementForm
            onSubmit={handleCreate}
            onCancel={() => setIsCreateModalOpen(false)}
            isLoading={createMutation.isLoading}
          />
        </Modal>
      )}
    </div>
  )
}
