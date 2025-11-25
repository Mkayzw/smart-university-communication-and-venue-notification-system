import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Send, Trash2 } from 'lucide-react'
import { useApiMutation, useApiQuery } from '../../hooks/useApi.js'
import { Loader } from '../../components/common/Loader.jsx'
import { EmptyState } from '../../components/common/EmptyState.jsx'
import { useAuth } from '../../hooks/useAuth.js'
import { apiFetch } from '../../utils/apiClient.js'

export const AnnouncementDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, token } = useAuth()
  const [comment, setComment] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  const announcementQuery = useApiQuery(`/announcements/${id}`)

  const commentMutation = useApiMutation(`/announcements/${id}/comments`, {
    method: 'POST',
    onSuccess: () => {
      setComment('')
      announcementQuery.refetch()
    }
  })

  if (announcementQuery.isLoading) {
    return <Loader label="Loading announcement" />
  }

  const announcement = announcementQuery.data?.data || announcementQuery.data

  if (!announcement) {
    return <EmptyState description="This announcement ghosted us." />
  }

  const created = new Date(announcement.createdAt)

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!comment.trim()) return
    await commentMutation.mutateAsync({ content: comment })
  }

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return
    
    setIsDeleting(true)
    try {
      await apiFetch(`/comments/${commentId}`, {
        method: 'DELETE',
        token
      })
      announcementQuery.refetch()
    } catch (error) {
      console.error('Failed to delete comment:', error)
      alert('Failed to delete comment. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  const canDeleteComment = (commentItem) => {
    return user?.id === commentItem.userId || user?.role === 'ADMIN'
  }

  return (
    <div className="space-y-8">
      <button
        className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600"
        type="button"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="h-4 w-4" /> Back to announcements
      </button>

      <div className="rounded-3xl border border-border/70 bg-white/80 p-6 shadow-soft">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-500">{announcement.targetAudience}</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900">{announcement.title}</h1>
        <p className="mt-2 text-sm text-slate-500">
          Posted on {created.toLocaleString()} by {announcement.author?.firstName} {announcement.author?.lastName}
        </p>
        <div className="mt-6 space-y-4 text-base leading-relaxed text-slate-700">
          {announcement.content
            ?.split('\n')
            .filter(Boolean)
            .map((paragraph, idx) => (
              <p key={idx}>{paragraph}</p>
            ))}
        </div>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Comments</h2>
        {announcement.comments?.length ? (
          <div className="space-y-3">
            {announcement.comments.map((item) => (
              <div key={item.id} className="group rounded-2xl border border-border/70 bg-white/70 p-4 relative hover:shadow-sm transition-shadow">
                {canDeleteComment(item) && (
                  <button
                    onClick={() => handleDeleteComment(item.id)}
                    disabled={isDeleting}
                    className="absolute top-3 right-3 p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                    title="Delete comment"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
                <div className="flex items-center justify-between pr-10">
                  <p className="text-sm font-semibold text-slate-800">
                    {item.user?.firstName} {item.user?.lastName}
                  </p>
                  <p className="text-xs text-slate-400">{new Date(item.createdAt).toLocaleString()}</p>
                </div>
                <p className="mt-2 text-sm text-slate-600">{item.content}</p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState description="No comments yet. Be the first to chime in." />
        )}
      </section>

      <form className="rounded-3xl border border-border/70 bg-white/80 p-5 shadow-inner" onSubmit={handleSubmit}>
        <p className="text-sm font-semibold text-slate-700">Drop a comment</p>
        <textarea
          className="mt-3 h-28 w-full resize-none rounded-2xl border border-border/70 bg-white/80 px-4 py-3 text-sm font-medium text-slate-600 shadow-inner outline-none"
          placeholder={user ? 'Say something smart (or at least polite)' : 'Login to comment'}
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          disabled={!user || commentMutation.isPending}
        />
        {user && (
          <div className="mt-3 flex justify-end">
            <button
              className="inline-flex items-center gap-2 rounded-2xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-card transition hover:bg-brand-600 disabled:opacity-50"
              type="submit"
              disabled={commentMutation.isPending || !comment.trim()}
            >
              <Send className="h-4 w-4" />
              {commentMutation.isPending ? 'Posting…' : 'Post' }
            </button>
          </div>
        )}
      </form>
    </div>
  )
}
