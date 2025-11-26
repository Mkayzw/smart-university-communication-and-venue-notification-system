import { useState, useEffect } from 'react';
import { useApiQuery } from '../../hooks/useApi';

const daysOfWeek = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

const ScheduleForm = ({ schedule, courses = [], onSubmit, onCancel, isLoading }) => {
  const [formData, setFormData] = useState({
    courseId: '',
    venueId: '',
    dayOfWeek: 'MONDAY',
    startTime: '',
    endTime: '',
    semester: '2025 Semester 1'
  });

  const [errors, setErrors] = useState({});

  // Fetch available venues based on selected day and time
  const shouldFetchVenues = formData.dayOfWeek && formData.startTime && formData.endTime;
  
  const availableVenuesQuery = useApiQuery('/venues/available', {
    params: {
      dayOfWeek: formData.dayOfWeek,
      startTime: formData.startTime,
      endTime: formData.endTime
    },
    enabled: shouldFetchVenues,
    onError: () => {
      // If error, fall back to all venues
      allVenuesQuery.refetch();
    }
  });

  // Fallback: fetch all venues if no time is selected
  const allVenuesQuery = useApiQuery('/venues', {
    params: { limit: 100 },
    enabled: !shouldFetchVenues
  });

  // Use available venues if we have time info, otherwise all venues
  const venues = shouldFetchVenues 
    ? (availableVenuesQuery.data?.data || [])
    : (allVenuesQuery.data?.data || []);

  const isLoadingVenues = shouldFetchVenues ? availableVenuesQuery.isLoading : allVenuesQuery.isLoading;

  useEffect(() => {
    if (schedule) {
      setFormData({
        courseId: schedule.courseId || '',
        venueId: schedule.venueId || '',
        dayOfWeek: schedule.dayOfWeek || 'MONDAY',
        startTime: schedule.startTime || '',
        endTime: schedule.endTime || '',
        semester: schedule.semester || '2025 Semester 1'
      });
    } else if (courses.length === 1) {
      setFormData((prev) => ({
        ...prev,
        courseId: courses[0].id
      }));
    }
  }, [schedule, courses]);

  // Reset venue selection when time changes
  useEffect(() => {
    if (shouldFetchVenues && formData.venueId) {
      // Check if currently selected venue is still available
      const isStillAvailable = venues.some(v => v.id === formData.venueId);
      if (!isStillAvailable) {
        setFormData(prev => ({ ...prev, venueId: '' }));
        setErrors(prev => ({ 
          ...prev, 
          venueId: 'Previously selected venue is not available for this time' 
        }));
      }
    }
  }, [venues, formData.venueId, shouldFetchVenues]);

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
    if (!formData.courseId) {
      newErrors.courseId = 'Course is required';
    }
    if (!formData.venueId) {
      newErrors.venueId = 'Venue is required';
    }
    if (!formData.startTime) {
      newErrors.startTime = 'Start time is required';
    }
    if (!formData.endTime) {
      newErrors.endTime = 'End time is required';
    }
    
    // Validate time format (HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (formData.startTime && !timeRegex.test(formData.startTime)) {
      newErrors.startTime = 'Invalid time format. Use HH:MM (e.g., 09:00)';
    }
    if (formData.endTime && !timeRegex.test(formData.endTime)) {
      newErrors.endTime = 'Invalid time format. Use HH:MM (e.g., 11:00)';
    }
    
    // Validate time range
    if (formData.startTime && formData.endTime) {
      if (formData.startTime >= formData.endTime) {
        newErrors.endTime = 'End time must be after start time';
      } else {
        // Check duration (max 8 hours)
        const [startHours, startMinutes] = formData.startTime.split(':').map(Number);
        const [endHours, endMinutes] = formData.endTime.split(':').map(Number);
        const duration = (endHours * 60 + endMinutes) - (startHours * 60 + startMinutes);
        if (duration > 8 * 60) {
          newErrors.endTime = 'Schedule duration cannot exceed 8 hours';
        }
      }
    }
    
    // Validate semester format
    if (!formData.semester.trim()) {
      newErrors.semester = 'Semester is required';
    } else {
      // Basic validation: must contain a year
      const semesterPattern = /\d{4}/;
      if (!semesterPattern.test(formData.semester) || formData.semester.trim().length < 6) {
        newErrors.semester = 'Invalid semester format. Example: "2024 Fall" or "2024 Semester 1"';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Course Selection */}
      <div>
        <label htmlFor="courseId" className="block text-sm font-medium text-gray-700 mb-1">
          Course <span className="text-red-500">*</span>
        </label>
        <select
          id="courseId"
          name="courseId"
          value={formData.courseId}
          onChange={handleChange}
          disabled={courses.length === 1}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.courseId ? 'border-red-500' : 'border-gray-300'
          } ${courses.length === 1 ? 'bg-gray-100' : ''}`}
        >
          <option value="">Select a course</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.code} - {course.name}
            </option>
          ))}
        </select>
        {errors.courseId && <p className="text-red-500 text-sm mt-1">{errors.courseId}</p>}
      </div>

      {/* Day of Week */}
      <div>
        <label htmlFor="dayOfWeek" className="block text-sm font-medium text-gray-700 mb-1">
          Day of Week <span className="text-red-500">*</span>
        </label>
        <select
          id="dayOfWeek"
          name="dayOfWeek"
          value={formData.dayOfWeek}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {daysOfWeek.map((day) => (
            <option key={day} value={day}>
              {day.charAt(0) + day.slice(1).toLowerCase()}
            </option>
          ))}
        </select>
      </div>

      {/* Time Selection */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">
            Start Time <span className="text-red-500">*</span>
          </label>
          <input
            type="time"
            id="startTime"
            name="startTime"
            value={formData.startTime}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.startTime ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.startTime && <p className="text-red-500 text-sm mt-1">{errors.startTime}</p>}
        </div>

        <div>
          <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-1">
            End Time <span className="text-red-500">*</span>
          </label>
          <input
            type="time"
            id="endTime"
            name="endTime"
            value={formData.endTime}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.endTime ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.endTime && <p className="text-red-500 text-sm mt-1">{errors.endTime}</p>}
        </div>
      </div>

      {/* Venue Selection - NOW SHOWS ONLY AVAILABLE VENUES! */}
      <div>
        <label htmlFor="venueId" className="block text-sm font-medium text-gray-700 mb-1">
          Venue <span className="text-red-500">*</span>
          {shouldFetchVenues && (
            <span className="text-sm text-green-600 ml-2">
              (Showing only available venues for selected time)
            </span>
          )}
        </label>
        
        {!shouldFetchVenues && (
          <p className="text-sm text-amber-600 mb-2">
            ⚠️ Select day and time first to see available venues
          </p>
        )}

        <select
          id="venueId"
          name="venueId"
          value={formData.venueId}
          onChange={handleChange}
          disabled={isLoadingVenues}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.venueId ? 'border-red-500' : 'border-gray-300'
          } ${isLoadingVenues ? 'bg-gray-100' : ''}`}
        >
          <option value="">
            {isLoadingVenues 
              ? 'Loading available venues...' 
              : venues.length === 0 
                ? 'No venues available for this time'
                : 'Select a venue'
            }
          </option>
          {venues.map((venue) => (
            <option key={venue.id} value={venue.id}>
              {venue.name} ({venue.building}) - Capacity: {venue.capacity}
              {venue.status === 'MAINTENANCE' && ' [Under Maintenance]'}
            </option>
          ))}
        </select>
        {errors.venueId && <p className="text-red-500 text-sm mt-1">{errors.venueId}</p>}
        
        {shouldFetchVenues && venues.length === 0 && !isLoadingVenues && (
          <p className="text-red-500 text-sm mt-1">
            No venues are available for the selected time. Please choose a different time slot.
          </p>
        )}
      </div>

      {/* Semester */}
      <div>
        <label htmlFor="semester" className="block text-sm font-medium text-gray-700 mb-1">
          Semester <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="semester"
          name="semester"
          value={formData.semester}
          onChange={handleChange}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.semester ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="e.g., 2025 Semester 1"
        />
        {errors.semester && <p className="text-red-500 text-sm mt-1">{errors.semester}</p>}
      </div>

      {/* Form Actions */}
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
          disabled={isLoading || (shouldFetchVenues && venues.length === 0)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isLoading && (
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          {schedule ? 'Update' : 'Create'} Schedule
        </button>
      </div>
    </form>
  );
};

export default ScheduleForm;