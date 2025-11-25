import { useState } from 'react'
import { Clock3, MapPin, UserCheck, Edit2, Trash2 } from 'lucide-react'
import { Modal } from '../common/Modal.jsx'
import ScheduleForm from '../forms/ScheduleForm.jsx'
import { useAuth } from '../../hooks/useAuth.js'
import { useApiMutation, useApiQuery } from '../../hooks/useApi.js'

const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export const ScheduleCard = ({ schedule, onUpdate }) => {
  const { user } = useAuth()
  const { id, venue, course, lecturer, dayOfWeek, startTime, endTime, semester } = schedule
  const dayLabel = typeof dayOfWeek === 'number' ? days[dayOfWeek] : dayOfWeek
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  const coursesQuery = useApiQuery('/courses', {
    params: { limit: 100 },
    enabled: isEditModalOpen
  })

  const venuesQuery = useApiQuery('/venues', {
    params: { limit: 100 },
    enabled: isEditModalOpen
  })

  const updateMutation = useApiMutation(`/schedules/${id}`, {
    method: 'PUT',
    onSuccess: () => {
      setIsEditModalOpen(false)
      if (onUpdate) onUpdate()
    }
  })

  const deleteMutation = useApiMutation(`/schedules/${id}`, {
    method: 'DELETE',
    onSuccess: () => {
      setIsDeleteModalOpen(false)
      if (onUpdate) onUpdate()
    }
  })

  const handleUpdate = (data) => {
    updateMutation.mutate(data)
  }

  const handleDelete = () => {
    deleteMutation.mutate()
  }

  const canEdit = user?.role === 'ADMIN' || (user?.role === 'LECTURER' && user?.id === lecturer?.id)

  return (
    <>
      <div className="group rounded-3xl border border-border/70 bg-white/80 p-5 shadow-inner shadow-brand-500/10 relative hover:-translate-y-1 transition-transform">
        {canEdit && (
          <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
              title="Edit schedule"
            >
              <Edit2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
              title="Delete schedule"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">{dayLabel}</p>
        <h3 className="mt-2 text-lg font-semibold text-slate-900">{course?.name || 'Course TBD'}</h3>
        <p className="text-sm font-medium text-slate-500">Semester {semester}</p>
        <div className="mt-4 grid gap-2 text-xs font-medium text-slate-500">
          <span className="inline-flex items-center gap-2">
            <Clock3 className="h-3.5 w-3.5 text-brand-500" /> {startTime} - {endTime}
          </span>
          {venue ? (
            <span className="inline-flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-accent-500" /> {venue.name} · {venue.building}
            </span>
          ) : null}
          {lecturer ? (
            <span className="inline-flex items-center gap-2">
              <UserCheck className="h-3.5 w-3.5 text-slate-400" /> {lecturer.firstName} {lecturer.lastName}
            </span>
          ) : null}
        </div>
      </div>

      {isEditModalOpen && (
        <Modal
          title="Edit Schedule"
          onClose={() => setIsEditModalOpen(false)}
        >
          <ScheduleForm
            schedule={schedule}
            courses={coursesQuery.data?.data || []}
            venues={venuesQuery.data?.data || []}
            onSubmit={handleUpdate}
            onCancel={() => setIsEditModalOpen(false)}
            isLoading={updateMutation.isLoading}
          />
        </Modal>
      )}

      {isDeleteModalOpen && (
        <Modal
          title="Delete Schedule"
          onClose={() => setIsDeleteModalOpen(false)}
        >
          <div className="space-y-4">
            <p className="text-gray-600">
              Are you sure you want to delete this schedule for <strong>{course?.name}</strong> on <strong>{dayLabel}</strong>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={deleteMutation.isLoading}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteMutation.isLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {deleteMutation.isLoading && (
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                Delete
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}
