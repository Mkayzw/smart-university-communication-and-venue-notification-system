import { useState, useEffect } from 'react';

const daysOfWeek = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

const ScheduleForm = ({ schedule, courses = [], venues = [], onSubmit, onCancel, isLoading }) => {
  const [formData, setFormData] = useState({
    courseId: '',
    venueId: '',
    dayOfWeek: 'MONDAY',
    startTime: '',
    endTime: '',
    semester: '2025 Semester 1'
  });

  const [errors, setErrors] = useState({});

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
      // Pre-select course if only one is provided (e.g., from course detail page)
      setFormData((prev) => ({
        ...prev,
        courseId: courses[0].id
      }));
    }
  }, [schedule, courses]);

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
    if (formData.startTime && formData.endTime && formData.startTime >= formData.endTime) {
      newErrors.endTime = 'End time must be after start time';
    }
    if (!formData.semester.trim()) {
      newErrors.semester = 'Semester is required';
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
        {courses.length === 1 && <p className="text-sm text-gray-500 mt-1">Course is pre-selected</p>}
      </div>

      <div>
        <label htmlFor="venueId" className="block text-sm font-medium text-gray-700 mb-1">
          Venue <span className="text-red-500">*</span>
        </label>
        <select
          id="venueId"
          name="venueId"
          value={formData.venueId}
          onChange={handleChange}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.venueId ? 'border-red-500' : 'border-gray-300'
          }`}
        >
          <option value="">Select a venue</option>
          {venues.map((venue) => (
            <option key={venue.id} value={venue.id}>
              {venue.name} ({venue.building}) - Capacity: {venue.capacity}
            </option>
          ))}
        </select>
        {errors.venueId && <p className="text-red-500 text-sm mt-1">{errors.venueId}</p>}
      </div>

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
          {schedule ? 'Update' : 'Create'} Schedule
        </button>
      </div>
    </form>
  );
};

export default ScheduleForm;
