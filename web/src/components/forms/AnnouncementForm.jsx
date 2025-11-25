import { useState, useEffect } from 'react';

const AnnouncementForm = ({ announcement, onSubmit, onCancel, isLoading }) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    targetAudience: 'ALL',
    pinned: false
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (announcement) {
      setFormData({
        title: announcement.title || '',
        content: announcement.content || '',
        targetAudience: announcement.targetAudience || 'ALL',
        pinned: announcement.pinned || false
      });
    }
  }, [announcement]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!formData.content.trim()) {
      newErrors.content = 'Content is required';
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
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.title ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Enter announcement title"
        />
        {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
      </div>

      <div>
        <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
          Content <span className="text-red-500">*</span>
        </label>
        <textarea
          id="content"
          name="content"
          value={formData.content}
          onChange={handleChange}
          rows={6}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.content ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Enter announcement content"
        />
        {errors.content && <p className="text-red-500 text-sm mt-1">{errors.content}</p>}
      </div>

      <div>
        <label htmlFor="targetAudience" className="block text-sm font-medium text-gray-700 mb-1">
          Target Audience
        </label>
        <select
          id="targetAudience"
          name="targetAudience"
          value={formData.targetAudience}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="ALL">All Users</option>
          <option value="STUDENTS">Students Only</option>
          <option value="LECTURERS">Lecturers Only</option>
        </select>
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="pinned"
          name="pinned"
          checked={formData.pinned}
          onChange={handleChange}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label htmlFor="pinned" className="ml-2 block text-sm text-gray-700">
          Pin this announcement to the top
        </label>
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
          {announcement ? 'Update' : 'Create'} Announcement
        </button>
      </div>
    </form>
  );
};

export default AnnouncementForm;
