import { Link } from 'react-router-dom'
import { useState } from 'react'
import { GraduationCap, MapPin, Users, Edit2, Trash2 } from 'lucide-react'
import { StatusPill } from '../common/StatusPill.jsx'
import { Modal } from '../common/Modal.jsx'
import CourseForm from '../forms/CourseForm.jsx'
import { useAuth } from '../../hooks/useAuth.js'
import { useApiMutation } from '../../hooks/useApi.js'

export const CourseCard = ({ course, onUpdate }) => {
  const { user } = useAuth()
  const { id, code, name, department, lecturer, _count, isEnrolled } = course
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  const updateMutation = useApiMutation(`/courses/${id}`, {
    method: 'PUT',
    onSuccess: () => {
      setIsEditModalOpen(false)
      if (onUpdate) onUpdate()
    }
  })

  const deleteMutation = useApiMutation(`/courses/${id}`, {
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

  // Only admins can edit/delete courses
  const canEdit = user?.role === 'ADMIN'

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
        to={`/courses/${id}`}
        className="group flex flex-col gap-4 rounded-3xl border border-border/70 bg-white/80 p-5 shadow-inner shadow-brand-500/10 transition hover:-translate-y-1 hover:border-brand-200 hover:shadow-soft relative"
      >
        {canEdit && (
          <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleEditClick}
              className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
              title="Edit course"
            >
              <Edit2 className="h-4 w-4" />
            </button>
            <button
              onClick={handleDeleteClick}
              className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
              title="Delete course"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{code}</p>
            <h3 className="mt-1 text-lg font-semibold text-slate-900 group-hover:text-brand-600">{name}</h3>
          </div>
          {isEnrolled ? <StatusPill tone="success">Enrolled</StatusPill> : null}
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-slate-500">
          {department ? (
            <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {department}</span>
          ) : null}
          {lecturer ? (
            <span className="inline-flex items-center gap-1"><GraduationCap className="h-3.5 w-3.5" /> {lecturer.firstName} {lecturer.lastName}</span>
          ) : null}
          <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {_count?.enrollments ?? 0} students</span>
        </div>
      </Link>

      {isEditModalOpen && (
        <Modal
          title="Edit Course"
          onClose={() => setIsEditModalOpen(false)}
        >
          <CourseForm
            course={course}
            onSubmit={handleUpdate}
            onCancel={() => setIsEditModalOpen(false)}
            isLoading={updateMutation.isLoading}
            isAdmin={user?.role === 'ADMIN'}
          />
        </Modal>
      )}

      {isDeleteModalOpen && (
        <Modal
          title="Delete Course"
          onClose={() => setIsDeleteModalOpen(false)}
        >
          <div className="space-y-4">
            <p className="text-gray-600">
              Are you sure you want to delete <strong>{code} - {name}</strong>? This action cannot be undone and will affect all enrolled students.
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
