import { useState, useEffect } from 'react';

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
    }
  }, [course]);

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

      {isAdmin && lecturers.length > 0 && (
        <div>
          <label htmlFor="lecturerId" className="block text-sm font-medium text-gray-700 mb-1">
            Assign Lecturer
          </label>
          <select
            id="lecturerId"
            name="lecturerId"
            value={formData.lecturerId}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a lecturer (optional)</option>
            {lecturers.map((lecturer) => (
              <option key={lecturer.id} value={lecturer.id}>
                {lecturer.firstName} {lecturer.lastName} - {lecturer.department}
              </option>
            ))}
          </select>
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
