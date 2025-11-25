import { useState, useEffect } from 'react'
import { ScheduleCard } from '../../components/cards/ScheduleCard.jsx'
import { EmptyState } from '../../components/common/EmptyState.jsx'
import { Loader } from '../../components/common/Loader.jsx'
import { PageHeader } from '../../components/common/PageHeader.jsx'
import { Modal } from '../../components/common/Modal.jsx'
import ScheduleForm from '../../components/forms/ScheduleForm.jsx'
import { useApiQuery, useApiMutation } from '../../hooks/useApi.js'
import { useAuth } from '../../hooks/useAuth.js'
import { getSocket, socketEvents } from '../../utils/socket.js'

const days = [
  { label: 'All days', value: '' },
  { label: 'Monday', value: 'MONDAY' },
  { label: 'Tuesday', value: 'TUESDAY' },
  { label: 'Wednesday', value: 'WEDNESDAY' },
  { label: 'Thursday', value: 'THURSDAY' },
  { label: 'Friday', value: 'FRIDAY' },
  { label: 'Saturday', value: 'SATURDAY' }
]

export const SchedulesPage = () => {
  const { user } = useAuth()
  const socket = getSocket()
  const [filters, setFilters] = useState({ dayOfWeek: '', semester: '' })
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const schedulesQuery = useApiQuery('/schedules', {
    params: {
      limit: 20,
      page: 1,
      dayOfWeek: filters.dayOfWeek || undefined,
      semester: filters.semester || undefined
    }
  })

  const coursesQuery = useApiQuery('/courses', {
    params: { limit: 100 },
    enabled: isCreateModalOpen
  })

  useEffect(() => {
    if (!socket) return

    const handleScheduleUpdate = (schedule) => {
      console.log('Schedule update received:', schedule)
      schedulesQuery.refetch()
    }

    socket.on(socketEvents.SCHEDULE_UPDATE, handleScheduleUpdate)

    return () => {
      socket.off(socketEvents.SCHEDULE_UPDATE, handleScheduleUpdate)
    }
  }, [socket, schedulesQuery])

  const venuesQuery = useApiQuery('/venues', {
    params: { limit: 100 },
    enabled: isCreateModalOpen
  })

  const createMutation = useApiMutation('/schedules', {
    method: 'POST',
    onSuccess: () => {
      setIsCreateModalOpen(false)
      schedulesQuery.refetch()
    }
  })

  const handleCreate = (data) => {
    createMutation.mutate(data)
  }

  const canCreateSchedule = user?.role === 'LECTURER' || user?.role === 'ADMIN'

  const actions = (
    <div className="flex flex-wrap items-center gap-3">
      {canCreateSchedule && (
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="rounded-2xl  bg-brand-500  px-4 py-2 text-sm font-medium text-white shadow-md"
        >
          + Create Schedule
        </button>
      )}
      <select
        className="rounded-2xl border border-border/70 bg-white/80 px-4 py-2 text-sm font-medium text-slate-600 shadow-inner outline-none"
        value={filters.dayOfWeek}
        onChange={(event) => setFilters((prev) => ({ ...prev, dayOfWeek: event.target.value }))}
      >
        {days.map((option) => (
          <option key={option.value || 'all'} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <input
        className="w-full rounded-2xl border border-border/70 bg-white/80 px-4 py-2 text-sm font-medium text-slate-600 shadow-inner outline-none md:w-40"
        placeholder="Semester"
        value={filters.semester}
        onChange={(event) => setFilters((prev) => ({ ...prev, semester: event.target.value }))}
      />
    </div>
  )

  return (
    <div>
      <PageHeader title="Schedules" subtitle="Keep track of where and when stuff happens." actions={actions} />

      {schedulesQuery.isLoading ? (
        <Loader label="Collecting schedules" />
      ) : schedulesQuery.data?.data?.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {schedulesQuery.data.data.map((schedule) => (
            <ScheduleCard 
              key={schedule.id} 
              schedule={schedule}
              onUpdate={schedulesQuery.refetch}
            />
          ))}
        </div>
      ) : (
        <EmptyState description="Nothing booked. Either a bug or a holiday." />
      )}

      {isCreateModalOpen && (
        <Modal
          title="Create Schedule"
          onClose={() => setIsCreateModalOpen(false)}
        >
          <ScheduleForm
            courses={coursesQuery.data?.data || []}
            venues={venuesQuery.data?.data || []}
            onSubmit={handleCreate}
            onCancel={() => setIsCreateModalOpen(false)}
            isLoading={createMutation.isLoading}
          />
        </Modal>
      )}
    </div>
  )
}
