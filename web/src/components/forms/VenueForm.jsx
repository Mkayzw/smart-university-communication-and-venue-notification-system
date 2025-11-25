import { useState, useEffect } from 'react';

const VenueForm = ({ venue, onSubmit, onCancel, isLoading }) => {
  const [formData, setFormData] = useState({
    name: '',
    building: '',
    capacity: '',
    facilities: '',
    status: 'AVAILABLE'
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (venue) {
      setFormData({
        name: venue.name || '',
        building: venue.building || '',
        capacity: venue.capacity || '',
        facilities: Array.isArray(venue.facilities) ? venue.facilities.join(', ') : '',
        status: venue.status || 'AVAILABLE'
      });
    }
  }, [venue]);

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
    if (!formData.name.trim()) {
      newErrors.name = 'Venue name is required';
    }
    if (!formData.building.trim()) {
      newErrors.building = 'Building is required';
    }
    if (!formData.capacity || parseInt(formData.capacity) <= 0) {
      newErrors.capacity = 'Capacity must be a positive number';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      const submitData = {
        ...formData,
        capacity: parseInt(formData.capacity),
        facilities: formData.facilities
          .split(',')
          .map(f => f.trim())
          .filter(f => f.length > 0)
      };
      onSubmit(submitData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Venue Name <span className="text-red-500">*</span>
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
          placeholder="e.g., Auditorium A"
        />
        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
      </div>

      <div>
        <label htmlFor="building" className="block text-sm font-medium text-gray-700 mb-1">
          Building <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="building"
          name="building"
          value={formData.building}
          onChange={handleChange}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.building ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="e.g., Main Hall"
        />
        {errors.building && <p className="text-red-500 text-sm mt-1">{errors.building}</p>}
      </div>

      <div>
        <label htmlFor="capacity" className="block text-sm font-medium text-gray-700 mb-1">
          Capacity <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          id="capacity"
          name="capacity"
          value={formData.capacity}
          onChange={handleChange}
          min="1"
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.capacity ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="e.g., 100"
        />
        {errors.capacity && <p className="text-red-500 text-sm mt-1">{errors.capacity}</p>}
      </div>

      <div>
        <label htmlFor="facilities" className="block text-sm font-medium text-gray-700 mb-1">
          Facilities (comma-separated)
        </label>
        <input
          type="text"
          id="facilities"
          name="facilities"
          value={formData.facilities}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., Projector, Sound System, Whiteboard"
        />
        <p className="text-sm text-gray-500 mt-1">Separate multiple facilities with commas</p>
      </div>

      <div>
        <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
          Status
        </label>
        <select
          id="status"
          name="status"
          value={formData.status}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="AVAILABLE">Available</option>
          <option value="OCCUPIED">Occupied</option>
          <option value="MAINTENANCE">Maintenance</option>
        </select>
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
          {venue ? 'Update' : 'Create'} Venue
        </button>
      </div>
    </form>
  );
};

export default VenueForm;
