import { useState } from 'react'
import { useApiQuery } from '../../hooks/useApi.js'
import { Search, AlertCircle, CheckCircle2 } from 'lucide-react'

export const AdminCourseForm = ({ formData, setFormData, onSubmit, error }) => {
  const [courseCodeSearch, setCourseCodeSearch] = useState('')
  const [lecturerSearch, setLecturerSearch] = useState('')
  const [showLecturerDropdown, setShowLecturerDropdown] = useState(false)

  // Search for existing courses with the same code
  const existingCoursesQuery = useApiQuery('/courses', {
    params: {
      search: courseCodeSearch || undefined,
      limit: 5
    },
    enabled: courseCodeSearch.length >= 2
  })

  // Search for lecturers
  const lecturersQuery = useApiQuery('/users', {
    params: {
      role: 'LECTURER',
      search: lecturerSearch || undefined,
      limit: 20
    },
    enabled: true
  })

  const existingCourses = existingCoursesQuery.data?.data || []
  const lecturers = lecturersQuery.data?.data || []
  
  // Check if current course code matches any existing course
  const isDuplicateCode = existingCourses.some(
    course => course.code.toLowerCase() === formData.code.toLowerCase()
  )

  const selectedLecturer = lecturers.find(l => l.id === formData.lecturerId)

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (isDuplicateCode) {
      return // Don't submit if duplicate
    }
    
    onSubmit(formData)
  }

  const handleCodeChange = (e) => {
    const value = e.target.value
    setFormData({ ...formData, code: value })
    setCourseCodeSearch(value)
  }

  const handleLecturerSelect = (lecturer) => {
    setFormData({ ...formData, lecturerId: lecturer.id })
    setLecturerSearch(`${lecturer.firstName} ${lecturer.lastName}`)
    setShowLecturerDropdown(false)
  }

  const clearLecturer = () => {
    setFormData({ ...formData, lecturerId: '' })
    setLecturerSearch('')
  }

  return (
    <form id="create-course-form" className="space-y-4" onSubmit={handleSubmit}>
      {/* Course Code with Search */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-600" htmlFor="course-code">
          Course Code <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            id="course-code"
            name="code"
            className="w-full rounded-2xl border border-border/70 bg-white/80 px-4 py-2 text-sm font-medium text-slate-600 shadow-inner outline-none"
            value={formData.code}
            onChange={handleCodeChange}
            placeholder="e.g., CSC101"
            required
          />
          {courseCodeSearch.length >= 2 && (
            <div className="absolute right-3 top-2.5">
              {existingCoursesQuery.isLoading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
              ) : isDuplicateCode ? (
                <AlertCircle className="h-5 w-5 text-red-500" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              )}
            </div>
          )}
        </div>
        
        {/* Show existing courses with similar code */}
        {courseCodeSearch.length >= 2 && existingCourses.length > 0 && (
          <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold text-slate-600 mb-2">
              Existing courses {isDuplicateCode && '(⚠️ Duplicate code detected)'}:
            </p>
            <ul className="space-y-1.5">
              {existingCourses.map(course => (
                <li
                  key={course.id}
                  className={`text-xs ${
                    course.code.toLowerCase() === formData.code.toLowerCase()
                      ? 'text-red-600 font-semibold'
                      : 'text-slate-600'
                  }`}
                >
                  {course.code} - {course.name} 
                  {course.lecturer && ` (${course.lecturer.firstName} ${course.lecturer.lastName})`}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Course Name and Department */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-600" htmlFor="course-name">
            Course Name <span className="text-red-500">*</span>
          </label>
          <input
            id="course-name"
            name="name"
            className="w-full rounded-2xl border border-border/70 bg-white/80 px-4 py-2 text-sm font-medium text-slate-600 shadow-inner outline-none"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Introduction to Computer Science"
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-600" htmlFor="course-department">
            Department
          </label>
          <input
            id="course-department"
            name="department"
            className="w-full rounded-2xl border border-border/70 bg-white/80 px-4 py-2 text-sm font-medium text-slate-600 shadow-inner outline-none"
            value={formData.department}
            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            placeholder="e.g., Computer Science"
          />
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-600" htmlFor="course-description">
          Description
        </label>
        <textarea
          id="course-description"
          name="description"
          className="h-24 w-full resize-none rounded-2xl border border-border/70 bg-white/80 px-4 py-3 text-sm font-medium text-slate-600 shadow-inner outline-none"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="What's this course about?"
        />
      </div>

      {/* Credits */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-600" htmlFor="course-credits">
          Credits
        </label>
        <input
          id="course-credits"
          name="credits"
          type="number"
          min="0"
          className="w-full rounded-2xl border border-border/70 bg-white/80 px-4 py-2 text-sm font-medium text-slate-600 shadow-inner outline-none"
          value={formData.credits}
          onChange={(e) => setFormData({ ...formData, credits: e.target.value })}
          placeholder="e.g., 3"
        />
      </div>

      {/* Lecturer Assignment with Search */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-600" htmlFor="course-lecturer">
          Assign Lecturer (optional)
        </label>
        <div className="relative">
          {selectedLecturer ? (
            <div className="flex items-center justify-between rounded-2xl border border-brand-200 bg-brand-50 px-4 py-2">
              <div>
                <p className="text-sm font-semibold text-brand-700">
                  {selectedLecturer.firstName} {selectedLecturer.lastName}
                </p>
                <p className="text-xs text-brand-600">{selectedLecturer.email}</p>
              </div>
              <button
                type="button"
                onClick={clearLecturer}
                className="text-brand-600 hover:text-brand-700"
              >
                ✕
              </button>
            </div>
          ) : (
            <>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  className="w-full rounded-2xl border border-border/70 bg-white/80 pl-10 pr-4 py-2 text-sm font-medium text-slate-600 shadow-inner outline-none"
                  placeholder="Search lecturers by name or email..."
                  value={lecturerSearch}
                  onChange={(e) => {
                    setLecturerSearch(e.target.value)
                    setShowLecturerDropdown(true)
                  }}
                  onFocus={() => setShowLecturerDropdown(true)}
                />
              </div>
              
              {showLecturerDropdown && lecturers.length > 0 && (
                <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-slate-200 bg-white shadow-lg">
                  {lecturers
                    .filter(l => 
                      !lecturerSearch || 
                      `${l.firstName} ${l.lastName} ${l.email}`.toLowerCase().includes(lecturerSearch.toLowerCase())
                    )
                    .map(lecturer => (
                      <button
                        key={lecturer.id}
                        type="button"
                        className="w-full px-4 py-2 text-left hover:bg-brand-50 transition-colors border-b border-slate-100 last:border-b-0"
                        onClick={() => handleLecturerSelect(lecturer)}
                      >
                        <p className="text-sm font-semibold text-slate-700">
                          {lecturer.firstName} {lecturer.lastName}
                        </p>
                        <p className="text-xs text-slate-500">{lecturer.email}</p>
                        {lecturer.department && (
                          <p className="text-xs text-slate-400">{lecturer.department}</p>
                        )}
                      </button>
                    ))}
                </div>
              )}
            </>
          )}
        </div>
        <p className="text-xs text-slate-500">
          Search and select a lecturer to assign them to this course
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      {/* Duplicate Warning */}
      {isDuplicateCode && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          ⚠️ A course with this code already exists. Please use a different code.
        </div>
      )}
    </form>
  )
}
