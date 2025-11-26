import { useState, useEffect, useRef } from 'react';
import { useApiQuery } from '../../hooks/useApi.js';
import { Search } from 'lucide-react';

const CourseForm = ({ course, lecturers = [], onSubmit, onCancel, isLoading, isAdmin }) => {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    department: '',
    credits: '',
    lecturerId: ''
  });

  const [errors, setErrors] = useState({});
  const [lecturerSearch, setLecturerSearch] = useState('');
  const [showLecturerDropdown, setShowLecturerDropdown] = useState(false);
  const lecturerDropdownRef = useRef(null);
  const lecturerInputRef = useRef(null);

  // Fetch lecturers if admin and no lecturers provided
  const lecturersQuery = useApiQuery('/users', {
    params: {
      role: 'LECTURER',
      ...(lecturerSearch && lecturerSearch.trim() ? { search: lecturerSearch.trim() } : {}),
      limit: 50
    },
    enabled: isAdmin && lecturers.length === 0
  });
  
  const allLecturers = lecturers.length > 0 ? lecturers : (lecturersQuery.data?.data || []);
  const selectedLecturer = allLecturers.find(l => l.id === formData.lecturerId);

  // Filter lecturers based on search
  const filteredLecturers = lecturerSearch
    ? allLecturers.filter(lec =>
        `${lec.firstName} ${lec.lastName}`.toLowerCase().includes(lecturerSearch.toLowerCase()) ||
        lec.email?.toLowerCase().includes(lecturerSearch.toLowerCase()) ||
        lec.department?.toLowerCase().includes(lecturerSearch.toLowerCase())
      ).slice(0, 10)
    : allLecturers.slice(0, 10);

  useEffect(() => {
    if (course) {
      setFormData({
        code: course.code || '',
        name: course.name || '',
        description: course.description || '',
        department: course.department || '',
        credits: course.credits || '',
        lecturerId: course.lecturerId || ''
      });
      
      // Set initial lecturer search if there's a selected lecturer
      if (course.lecturer) {
        setLecturerSearch(`${course.lecturer.firstName} ${course.lecturer.lastName}`);
      }
    }
  }, [course]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        lecturerDropdownRef.current &&
        !lecturerDropdownRef.current.contains(event.target) &&
        lecturerInputRef.current &&
        !lecturerInputRef.current.contains(event.target)
      ) {
        setShowLecturerDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLecturerSelect = (lecturer) => {
    setFormData({ ...formData, lecturerId: lecturer.id });
    setLecturerSearch(`${lecturer.firstName} ${lecturer.lastName}`);
    setShowLecturerDropdown(false);
  };

  const clearLecturer = () => {
    setFormData({ ...formData, lecturerId: '' });
    setLecturerSearch('');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.code.trim()) {
      newErrors.code = 'Course code is required';
    }
    if (!formData.name.trim()) {
      newErrors.name = 'Course name is required';
    }
    if (formData.credits && (isNaN(parseInt(formData.credits)) || parseInt(formData.credits) < 0)) {
      newErrors.credits = 'Credits must be a positive number';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      const submitData = {
        ...formData,
        credits: formData.credits ? parseInt(formData.credits) : undefined,
        description: formData.description || undefined,
        department: formData.department || undefined,
        lecturerId: formData.lecturerId || undefined
      };
      onSubmit(submitData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
          Course Code <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="code"
          name="code"
          value={formData.code}
          onChange={handleChange}
          disabled={!!course}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.code ? 'border-red-500' : 'border-gray-300'
          } ${course ? 'bg-gray-100' : ''}`}
          placeholder="e.g., CSC101"
        />
        {errors.code && <p className="text-red-500 text-sm mt-1">{errors.code}</p>}
        {course && <p className="text-sm text-gray-500 mt-1">Course code cannot be changed</p>}
      </div>

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Course Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.name ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="e.g., Introduction to Computer Science"
        />
        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Course description"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
            Department
          </label>
          <input
            type="text"
            id="department"
            name="department"
            value={formData.department}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Computer Science"
          />
        </div>

        <div>
          <label htmlFor="credits" className="block text-sm font-medium text-gray-700 mb-1">
            Credits
          </label>
          <input
            type="number"
            id="credits"
            name="credits"
            value={formData.credits}
            onChange={handleChange}
            min="0"
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.credits ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="e.g., 3"
          />
          {errors.credits && <p className="text-red-500 text-sm mt-1">{errors.credits}</p>}
        </div>
      </div>

      {isAdmin && (
        <div>
          <label htmlFor="lecturerId" className="block text-sm font-medium text-gray-700 mb-1">
            Assign Lecturer
          </label>
          <div className="relative">
            {selectedLecturer ? (
              <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-3 py-2">
                <div>
                  <p className="text-sm font-semibold text-blue-700">
                    {selectedLecturer.firstName} {selectedLecturer.lastName}
                  </p>
                  <p className="text-xs text-blue-600">{selectedLecturer.email}</p>
                  {selectedLecturer.department && (
                    <p className="text-xs text-blue-500">{selectedLecturer.department}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={clearLecturer}
                  className="text-blue-600 hover:text-blue-700 font-bold text-lg"
                >
                  ✕
                </button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    ref={lecturerInputRef}
                    type="text"
                    className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Search lecturers by name, email, or department..."
                    value={lecturerSearch}
                    onChange={(e) => {
                      setLecturerSearch(e.target.value);
                      setShowLecturerDropdown(true);
                    }}
                    onFocus={() => setShowLecturerDropdown(true)}
                  />
                </div>
                
                {showLecturerDropdown && (
                  <div
                    ref={lecturerDropdownRef}
                    className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg"
                  >
                    {lecturersQuery.isLoading ? (
                      <div className="px-4 py-3 text-sm text-gray-500 text-center">
                        Loading lecturers...
                      </div>
                    ) : filteredLecturers.length > 0 ? (
                      <>
                        <div className="px-3 py-2 border-b border-gray-200 bg-gray-50">
                          <p className="text-xs font-semibold text-gray-600">Select lecturer to assign</p>
                        </div>
                        {filteredLecturers.map(lecturer => (
                          <button
                            key={lecturer.id}
                            type="button"
                            className="w-full px-4 py-2 text-left hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
                            onClick={() => handleLecturerSelect(lecturer)}
                          >
                            <p className="text-sm font-semibold text-gray-700">
                              {lecturer.firstName} {lecturer.lastName}
                            </p>
                            <p className="text-xs text-gray-500">{lecturer.email}</p>
                            {lecturer.department && (
                              <p className="text-xs text-gray-400">{lecturer.department}</p>
                            )}
                          </button>
                        ))}
                      </>
                    ) : (
                      <div className="px-4 py-3 text-sm text-gray-500 text-center">
                        {lecturerSearch ? 'No lecturers found matching your search' : 'No lecturers available'}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
          {course && (
            <p className="text-xs text-gray-500 mt-1">
              Current: {course.lecturer ? `${course.lecturer.firstName} ${course.lecturer.lastName}` : 'No lecturer assigned'}
            </p>
          )}
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {isLoading && (
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          {course ? 'Update' : 'Create'} Course
        </button>
      </div>
    </form>
  );
};

export default CourseForm;
