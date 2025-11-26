import { useState, useEffect, useRef } from 'react'
import { useApiQuery } from '../../hooks/useApi.js'
import { Search, AlertCircle, CheckCircle2 } from 'lucide-react'

export const AdminCourseForm = ({ formData, setFormData, onSubmit, error }) => {
  const [courseCodeSearch, setCourseCodeSearch] = useState('')
  const [courseNameSearch, setCourseNameSearch] = useState('')
  const [departmentSearch, setDepartmentSearch] = useState('')
  const [lecturerSearch, setLecturerSearch] = useState('')
  
  const [showCourseCodeDropdown, setShowCourseCodeDropdown] = useState(false)
  const [showCourseNameDropdown, setShowCourseNameDropdown] = useState(false)
  const [showDepartmentDropdown, setShowDepartmentDropdown] = useState(false)
  const [showLecturerDropdown, setShowLecturerDropdown] = useState(false)
  
  const courseCodeDropdownRef = useRef(null)
  const courseCodeInputRef = useRef(null)
  const courseNameDropdownRef = useRef(null)
  const courseNameInputRef = useRef(null)
  const departmentDropdownRef = useRef(null)
  const departmentInputRef = useRef(null)
  const lecturerDropdownRef = useRef(null)
  const lecturerInputRef = useRef(null)

  // Fetch all courses for dropdowns
  const allCoursesQuery = useApiQuery('/courses', {
    params: { limit: 1000 }
  })

  // Search for existing courses
  const existingCoursesQuery = useApiQuery('/courses', {
    params: {
      search: courseCodeSearch || undefined,
      limit: 10
    },
    enabled: courseCodeSearch.length >= 2
  })

  // Search for lecturers
  const lecturersQuery = useApiQuery('/users', {
    params: {
      role: 'LECTURER',
      ...(lecturerSearch && lecturerSearch.trim() ? { search: lecturerSearch.trim() } : {}),
      limit: 50
    },
    enabled: true
  })

  const allCourses = allCoursesQuery.data?.data || []
  const existingCourses = existingCoursesQuery.data?.data || []
  const lecturers = lecturersQuery.data?.data || []
  
  // Get unique departments from all courses
  const departments = [...new Set(allCourses.map(c => c.department).filter(Boolean))].sort()
  
  // Check if current course code matches any existing course
  const isDuplicateCode = existingCourses.some(
    course => course.code.toLowerCase() === formData.code.toLowerCase()
  )

  const selectedLecturer = lecturers.find(l => l.id === formData.lecturerId)

  // Filter courses by code
  const filteredCoursesByCode = courseCodeSearch
    ? allCourses.filter(c => 
        c.code.toLowerCase().includes(courseCodeSearch.toLowerCase())
      ).slice(0, 10)
    : []

  // Filter courses by name
  const filteredCoursesByName = courseNameSearch
    ? allCourses.filter(c => 
        c.name.toLowerCase().includes(courseNameSearch.toLowerCase())
      ).slice(0, 10)
    : []

  // Filter departments
  const filteredDepartments = departmentSearch
    ? departments.filter(d => 
        d.toLowerCase().includes(departmentSearch.toLowerCase())
      )
    : departments

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const refs = [
        { dropdown: courseCodeDropdownRef, input: courseCodeInputRef, setter: setShowCourseCodeDropdown },
        { dropdown: courseNameDropdownRef, input: courseNameInputRef, setter: setShowCourseNameDropdown },
        { dropdown: departmentDropdownRef, input: departmentInputRef, setter: setShowDepartmentDropdown },
        { dropdown: lecturerDropdownRef, input: lecturerInputRef, setter: setShowLecturerDropdown }
      ]

      refs.forEach(({ dropdown, input, setter }) => {
        if (
          dropdown.current && 
          !dropdown.current.contains(event.target) &&
          input.current &&
          !input.current.contains(event.target)
        ) {
          setter(false)
        }
      })
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (isDuplicateCode) {
      return // Don't submit if duplicate
    }
    
    onSubmit(formData)
  }

  const handleCourseCodeSelect = (course) => {
    setFormData({
      ...formData,
      code: course.code,
      name: course.name,
      department: course.department || '',
      description: course.description || '',
      credits: course.credits || '',
      lecturerId: course.lecturerId || ''
    })
    setCourseCodeSearch(course.code)
    setShowCourseCodeDropdown(false)
  }

  const handleCourseNameSelect = (course) => {
    setFormData({
      ...formData,
      code: course.code,
      name: course.name,
      department: course.department || formData.department,
      description: course.description || formData.description,
      credits: course.credits || formData.credits
    })
    setCourseNameSearch(course.name)
    setShowCourseNameDropdown(false)
  }

  const handleDepartmentSelect = (dept) => {
    setFormData({ ...formData, department: dept })
    setDepartmentSearch(dept)
    setShowDepartmentDropdown(false)
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
      {/* Course Code with Dropdown */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-600" htmlFor="course-code">
          Course Code <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
          <input
            ref={courseCodeInputRef}
            id="course-code"
            name="code"
            className="w-full rounded-2xl border border-border/70 bg-white/80 pl-10 pr-4 py-2 text-sm font-medium text-slate-600 shadow-inner outline-none"
            value={formData.code}
            onChange={(e) => {
              setFormData({ ...formData, code: e.target.value })
              setCourseCodeSearch(e.target.value)
              setShowCourseCodeDropdown(true)
            }}
            onFocus={() => setShowCourseCodeDropdown(true)}
            placeholder="Search existing course code or type new..."
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
        
        {showCourseCodeDropdown && filteredCoursesByCode.length > 0 && (
          <div 
            ref={courseCodeDropdownRef}
            className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-slate-200 bg-white shadow-lg"
          >
            <div className="px-3 py-2 border-b border-slate-200 bg-slate-50">
              <p className="text-xs font-semibold text-slate-600">Select existing course or create new</p>
            </div>
            {filteredCoursesByCode.map(course => (
              <button
                key={course.id}
                type="button"
                className="w-full px-4 py-2 text-left hover:bg-brand-50 transition-colors border-b border-slate-100 last:border-b-0"
                onClick={() => handleCourseCodeSelect(course)}
              >
                <p className="text-sm font-semibold text-slate-700">
                  {course.code} - {course.name}
                </p>
                {course.department && (
                  <p className="text-xs text-slate-500">{course.department}</p>
                )}
                {course.lecturer && (
                  <p className="text-xs text-slate-400">
                    Lecturer: {course.lecturer.firstName} {course.lecturer.lastName}
                  </p>
                )}
              </button>
            ))}
          </div>
        )}
        
        {isDuplicateCode && (
          <p className="text-xs text-red-600 mt-1">
            ⚠️ A course with this code already exists
          </p>
        )}
      </div>

      {/* Course Name with Dropdown */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-600" htmlFor="course-name">
          Course Name <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
          <input
            ref={courseNameInputRef}
            id="course-name"
            name="name"
            className="w-full rounded-2xl border border-border/70 bg-white/80 pl-10 pr-4 py-2 text-sm font-medium text-slate-600 shadow-inner outline-none"
            value={formData.name}
            onChange={(e) => {
              setFormData({ ...formData, name: e.target.value })
              setCourseNameSearch(e.target.value)
              setShowCourseNameDropdown(true)
            }}
            onFocus={() => setShowCourseNameDropdown(true)}
            placeholder="Search existing course name or type new..."
            required
          />
        </div>
        
        {showCourseNameDropdown && filteredCoursesByName.length > 0 && (
          <div 
            ref={courseNameDropdownRef}
            className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-slate-200 bg-white shadow-lg"
          >
            <div className="px-3 py-2 border-b border-slate-200 bg-slate-50">
              <p className="text-xs font-semibold text-slate-600">Select existing course or create new</p>
            </div>
            {filteredCoursesByName.map(course => (
              <button
                key={course.id}
                type="button"
                className="w-full px-4 py-2 text-left hover:bg-brand-50 transition-colors border-b border-slate-100 last:border-b-0"
                onClick={() => handleCourseNameSelect(course)}
              >
                <p className="text-sm font-semibold text-slate-700">
                  {course.code} - {course.name}
                </p>
                {course.department && (
                  <p className="text-xs text-slate-500">{course.department}</p>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Department with Dropdown */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-600" htmlFor="course-department">
          Department
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
          <input
            ref={departmentInputRef}
            id="course-department"
            name="department"
            className="w-full rounded-2xl border border-border/70 bg-white/80 pl-10 pr-4 py-2 text-sm font-medium text-slate-600 shadow-inner outline-none"
            value={formData.department}
            onChange={(e) => {
              setFormData({ ...formData, department: e.target.value })
              setDepartmentSearch(e.target.value)
              setShowDepartmentDropdown(true)
            }}
            onFocus={() => setShowDepartmentDropdown(true)}
            placeholder="Search existing department or type new..."
          />
        </div>
        
        {showDepartmentDropdown && filteredDepartments.length > 0 && (
          <div 
            ref={departmentDropdownRef}
            className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-slate-200 bg-white shadow-lg"
          >
            <div className="px-3 py-2 border-b border-slate-200 bg-slate-50">
              <p className="text-xs font-semibold text-slate-600">Select existing department or create new</p>
            </div>
            {filteredDepartments.map(dept => (
              <button
                key={dept}
                type="button"
                className="w-full px-4 py-2 text-left hover:bg-brand-50 transition-colors border-b border-slate-100 last:border-b-0"
                onClick={() => handleDepartmentSelect(dept)}
              >
                <p className="text-sm font-semibold text-slate-700">{dept}</p>
              </button>
            ))}
          </div>
        )}
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
                {selectedLecturer.department && (
                  <p className="text-xs text-brand-500">{selectedLecturer.department}</p>
                )}
              </div>
              <button
                type="button"
                onClick={clearLecturer}
                className="text-brand-600 hover:text-brand-700 font-bold text-lg"
              >
                ✕
              </button>
            </div>
          ) : (
            <>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                <input
                  ref={lecturerInputRef}
                  type="text"
                  className="w-full rounded-2xl border border-border/70 bg-white/80 pl-10 pr-4 py-2 text-sm font-medium text-slate-600 shadow-inner outline-none"
                  placeholder="Search lecturers by name, email, or department..."
                  value={lecturerSearch}
                  onChange={(e) => {
                    setLecturerSearch(e.target.value)
                    setShowLecturerDropdown(true)
                  }}
                  onFocus={() => setShowLecturerDropdown(true)}
                />
              </div>
              
              {showLecturerDropdown && (
                <div 
                  ref={lecturerDropdownRef}
                  className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-slate-200 bg-white shadow-lg"
                >
                  {lecturersQuery.isLoading ? (
                    <div className="px-4 py-3 text-sm text-slate-500 text-center">
                      Loading lecturers...
                    </div>
                  ) : lecturers.length > 0 ? (
                    <>
                      <div className="px-3 py-2 border-b border-slate-200 bg-slate-50">
                        <p className="text-xs font-semibold text-slate-600">Select lecturer to assign</p>
                      </div>
                      {lecturers.map(lecturer => (
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
                    </>
                  ) : (
                    <div className="px-4 py-3 text-sm text-slate-500 text-center">
                      {lecturerSearch ? 'No lecturers found matching your search' : 'No lecturers available'}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
        <p className="text-xs text-slate-500">
          Search and select a lecturer to assign them to this course, or leave blank to assign later
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
          ⚠️ A course with this code already exists. Please use a different code or select the existing course from the dropdown.
        </div>
      )}
    </form>
  )
}