/**
 * Security Configuration
 * Centralized security settings and validations
 */

// Validate required environment variables
const validateEnvVars = () => {
  const required = ['JWT_SECRET', 'DATABASE_URL'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please set these in your .env file'
    );
  }
};

// Password validation with strength requirements
const validatePasswordStrength = (password) => {
  if (!password || password.length < 8) {
    return {
      valid: false,
      message: 'Password must be at least 8 characters long'
    };
  }
  
  if (password.length > 128) {
    return {
      valid: false,
      message: 'Password must be less than 128 characters'
    };
  }
  
  // Check for at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    return {
      valid: false,
      message: 'Password must contain at least one uppercase letter'
    };
  }
  
  // Check for at least one lowercase letter
  if (!/[a-z]/.test(password)) {
    return {
      valid: false,
      message: 'Password must contain at least one lowercase letter'
    };
  }
  
  // Check for at least one number
  if (!/[0-9]/.test(password)) {
    return {
      valid: false,
      message: 'Password must contain at least one number'
    };
  }
  
  return { valid: true };
};

// Sanitize input to prevent XSS
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

// Validate email format
const validateEmailFormat = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Rate limiting configuration
const rateLimitConfig = {
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 requests per window
    message: 'Too many authentication attempts. Please try again later.'
  },
  general: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    message: 'Too many requests. Please slow down.'
  },
  strict: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 requests per window
    message: 'Too many requests. Please try again later.'
  }
};

module.exports = {
  validateEnvVars,
  validatePasswordStrength,
  sanitizeInput,
  validateEmailFormat,
  rateLimitConfig
};
