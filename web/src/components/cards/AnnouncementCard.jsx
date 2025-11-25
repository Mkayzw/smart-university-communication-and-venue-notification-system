import { Link } from 'react-router-dom'
import { useState } from 'react'
import { CalendarClock, MessageCircle, Edit2, Trash2 } from 'lucide-react'
import { StatusPill } from '../common/StatusPill.jsx'
import { Modal } from '../common/Modal.jsx'
import AnnouncementForm from '../forms/AnnouncementForm.jsx'
import { useAuth } from '../../hooks/useAuth.js'
import { useApiMutation } from '../../hooks/useApi.js'

const audienceCopy = {
  ALL: 'Everyone',
  STUDENTS: 'Students',
  LECTURERS: 'Lecturers'
}

export const AnnouncementCard = ({ announcement, onUpdate }) => {
  const { user } = useAuth()
  const { id, title, content, targetAudience, createdAt, _count, author } = announcement
  const created = new Date(createdAt)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  const updateMutation = useApiMutation(`/announcements/${id}`, {
    method: 'PUT',
    onSuccess: () => {
      setIsEditModalOpen(false)
      if (onUpdate) onUpdate()
    }
  })

  const deleteMutation = useApiMutation(`/announcements/${id}`, {
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

  const canEdit = user?.id === author?.id || user?.role === 'ADMIN'

  const handleEditClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsEditModalOpen(true)
  }

  const handleDeleteClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDeleteModalOpen(true)
  }

  return (
    <>
      <Link
        to={`/announcements/${id}`}
        className="group block rounded-3xl border border-border/70 bg-white/80 p-5 shadow-inner shadow-brand-500/10 transition hover:-translate-y-1 hover:border-brand-200 hover:shadow-soft relative"
      >
        {canEdit && (
          <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleEditClick}
              className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
              title="Edit announcement"
            >
              <Edit2 className="h-4 w-4" />
            </button>
            <button
              onClick={handleDeleteClick}
              className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
              title="Delete announcement"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{audienceCopy[targetAudience] || 'Everyone'}</p>
            <h3 className="mt-2 text-lg font-semibold text-slate-900 transition group-hover:text-brand-600">{title}</h3>
          </div>
          <StatusPill tone="info">{_count?.comments ?? 0} replies</StatusPill>
        </div>
        <p className="mt-3 line-clamp-2 text-sm text-slate-500">{content}</p>
        <div className="mt-5 flex flex-wrap items-center gap-4 text-xs font-medium text-slate-400">
          <span className="inline-flex items-center gap-1">
            <CalendarClock className="h-3.5 w-3.5" />
            {created.toLocaleString()}
          </span>
          <span className="inline-flex items-center gap-1">
            <MessageCircle className="h-3.5 w-3.5" />
            {_count?.comments ?? 0} comments
          </span>
        </div>
      </Link>

      {isEditModalOpen && (
        <Modal
          title="Edit Announcement"
          onClose={() => setIsEditModalOpen(false)}
        >
          <AnnouncementForm
            announcement={announcement}
            onSubmit={handleUpdate}
            onCancel={() => setIsEditModalOpen(false)}
            isLoading={updateMutation.isLoading}
          />
        </Modal>
      )}

      {isDeleteModalOpen && (
        <Modal
          title="Delete Announcement"
          onClose={() => setIsDeleteModalOpen(false)}
        >
          <div className="space-y-4">
            <p className="text-gray-600">
              Are you sure you want to delete this announcement? This action cannot be undone.
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
