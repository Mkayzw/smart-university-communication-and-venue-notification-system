import { useState } from 'react'
import { VenueCard } from '../../components/cards/VenueCard.jsx'
import { EmptyState } from '../../components/common/EmptyState.jsx'
import { Loader } from '../../components/common/Loader.jsx'
import { PageHeader } from '../../components/common/PageHeader.jsx'
import { Modal } from '../../components/common/Modal.jsx'
import VenueForm from '../../components/forms/VenueForm.jsx'
import { useApiQuery, useApiMutation } from '../../hooks/useApi.js'
import { useAuth } from '../../hooks/useAuth.js'

export const VenuesPage = () => {
  const { user } = useAuth()
  const [filters, setFilters] = useState({ search: '', status: '' })
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const venuesQuery = useApiQuery('/venues', { params: { limit: 20, page: 1 } })

  const createMutation = useApiMutation('/venues', {
    method: 'POST',
    onSuccess: () => {
      setIsCreateModalOpen(false)
      venuesQuery.refetch()
    }
  })

  const handleCreate = (data) => {
    createMutation.mutate(data)
  }

  const canCreateVenue = user?.role === 'ADMIN'

  const actions = (
    <div className="flex flex-wrap items-center gap-3">
      {canCreateVenue && (
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="rounded-2xl  bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-md "
        >
          + Create Venue
        </button>
      )}
      <input
        className="w-full rounded-2xl border border-border/70 bg-white/80 px-4 py-2 text-sm font-medium text-slate-600 shadow-inner outline-none md:w-64"
        placeholder="Search venues"
        value={filters.search}
        onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
      />
      <select
        className="rounded-2xl border border-border/70 bg-white/80 px-4 py-2 text-sm font-medium text-slate-600 shadow-inner outline-none"
        value={filters.status}
        onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}
      >
        <option value="">All statuses</option>
        <option value="AVAILABLE">Available</option>
        <option value="MAINTENANCE">Maintenance</option>
        <option value="OCCUPIED">Occupied</option>
      </select>
    </div>
  )

  return (
    <div>
      <PageHeader title="Venues" subtitle="Find rooms that aren't currently hijacked." actions={actions} />

      {venuesQuery.isLoading ? (
        <Loader label="Fetching venues" />
      ) : venuesQuery.data?.data?.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {venuesQuery.data.data.map((venue) => (
            <VenueCard 
              key={venue.id} 
              venue={venue}
              onUpdate={venuesQuery.refetch}
            />
          ))}
        </div>
      ) : (
        <EmptyState description="All venues are quiet. Weird." />
      )}

      {isCreateModalOpen && (
        <Modal
          title="Create Venue"
          onClose={() => setIsCreateModalOpen(false)}
        >
          <VenueForm
            onSubmit={handleCreate}
            onCancel={() => setIsCreateModalOpen(false)}
            isLoading={createMutation.isLoading}
          />
        </Modal>
      )}
    </div>
  )
}
