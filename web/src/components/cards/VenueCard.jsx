import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, Users, PlugZap, Edit2, Trash2 } from 'lucide-react'
import { StatusPill } from '../common/StatusPill.jsx'
import { Modal } from '../common/Modal.jsx'
import VenueForm from '../forms/VenueForm.jsx'
import { useAuth } from '../../hooks/useAuth.js'
import { useApiMutation } from '../../hooks/useApi.js'

export const VenueCard = ({ venue, onUpdate }) => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { id, name, building, capacity, facilities = [], status } = venue
  const tone = status === 'AVAILABLE' ? 'success' : 'warning'
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  const updateMutation = useApiMutation(`/venues/${id}`, {
    method: 'PUT',
    onSuccess: () => {
      setIsEditModalOpen(false)
      if (onUpdate) onUpdate()
    }
  })

  const deleteMutation = useApiMutation(`/venues/${id}`, {
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

  const canEdit = user?.role === 'ADMIN'

  const handleCardClick = (e) => {
    // Don't navigate if clicking on edit/delete buttons
    if (e.target.closest('button')) return
    navigate(`/venues/${id}`)
  }

  return (
    <>
      <div 
        className="group rounded-3xl border border-border/70 bg-white/80 p-5 shadow-inner shadow-brand-500/10 relative hover:-translate-y-1 transition-transform cursor-pointer"
        onClick={handleCardClick}
      >
        {canEdit && (
          <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
              title="Edit venue"
            >
              <Edit2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
              title="Delete venue"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{name}</h3>
            <p className="text-sm font-medium text-slate-500">{building}</p>
          </div>
          <StatusPill tone={tone}>{status}</StatusPill>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500">
          <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {capacity} seats</span>
          {facilities.length ? (
            <span className="inline-flex items-center gap-1"><PlugZap className="h-3.5 w-3.5" /> {facilities.join(', ')}</span>
          ) : null}
          <span className="inline-flex items-center gap-1"><Building2 className="h-3.5 w-3.5" /> {building}</span>
        </div>
      </div>

      {isEditModalOpen && (
        <Modal
          title="Edit Venue"
          onClose={() => setIsEditModalOpen(false)}
        >
          <VenueForm
            venue={venue}
            onSubmit={handleUpdate}
            onCancel={() => setIsEditModalOpen(false)}
            isLoading={updateMutation.isLoading}
          />
        </Modal>
      )}

      {isDeleteModalOpen && (
        <Modal
          title="Delete Venue"
          onClose={() => setIsDeleteModalOpen(false)}
        >
          <div className="space-y-4">
            <p className="text-gray-600">
              Are you sure you want to delete <strong>{name}</strong>? This action cannot be undone.
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
