const { AppError } = require('./errorHandler');

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  // Minimum 8 characters, at least one letter and one number
  return password.length >= 8;
};

const validateRequired = (fields, body) => {
  const missing = [];
  fields.forEach(field => {
    if (!body[field]) {
      missing.push(field);
    }
  });
  
  if (missing.length > 0) {
    throw new AppError(`Missing required fields: ${missing.join(', ')}`, 400);
  }
};

const validateRole = (role) => {
  const validRoles = ['STUDENT', 'LECTURER', 'ADMIN'];
  return validRoles.includes(role);
};

const validateTargetAudience = (audience) => {
  const validAudiences = ['ALL', 'STUDENTS', 'LECTURERS'];
  return validAudiences.includes(audience);
};

const validateVenueStatus = (status) => {
  const validStatuses = ['AVAILABLE', 'OCCUPIED', 'MAINTENANCE'];
  return validStatuses.includes(status);
};

const validateDayOfWeek = (day) => {
  const validDays = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
  return validDays.includes(day);
};

const validateTimeFormat = (time) => {
  // Validate HH:MM format
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
};

const validateTimeRange = (startTime, endTime) => {
  if (!validateTimeFormat(startTime) || !validateTimeFormat(endTime)) {
    return { valid: false, message: 'Invalid time format. Use HH:MM' };
  }
  
  const [startHours, startMinutes] = startTime.split(':').map(Number);
  const [endHours, endMinutes] = endTime.split(':').map(Number);
  
  const startTotal = startHours * 60 + startMinutes;
  const endTotal = endHours * 60 + endMinutes;
  
  if (startTotal >= endTotal) {
    return { valid: false, message: 'Start time must be before end time' };
  }
  
  // Check if duration is reasonable (not more than 8 hours)
  const duration = endTotal - startTotal;
  if (duration > 8 * 60) {
    return { valid: false, message: 'Schedule duration cannot exceed 8 hours' };
  }
  
  return { valid: true };
};

const validateSemester = (semester) => {
  if (!semester || typeof semester !== 'string') {
    return false;
  }
  
  // Basic validation: should contain year and semester identifier
  // Examples: "2024 Fall", "2024-2025 Fall", "Fall 2024", "2024 Semester 1"
  const semesterPattern = /\d{4}/; // Must contain a year
  return semesterPattern.test(semester) && semester.trim().length >= 6;
};

// Check if two time intervals overlap
const timeIntervalsOverlap = (start1, end1, start2, end2) => {
  // Convert to minutes for comparison
  const toMinutes = (time) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };
  
  const s1 = toMinutes(start1);
  const e1 = toMinutes(end1);
  const s2 = toMinutes(start2);
  const e2 = toMinutes(end2);
  
  // Two intervals overlap if: start1 < end2 AND start2 < end1
  return s1 < e2 && s2 < e1;
};

module.exports = {
  validateEmail,
  validatePassword,
  validateRequired,
  validateRole,
  validateTargetAudience,
  validateVenueStatus,
  validateDayOfWeek,
  validateTimeFormat,
  validateTimeRange,
  validateSemester,
  timeIntervalsOverlap
};

