/**
 * Security utilities for input sanitization and XSS prevention
 */

/**
 * Sanitizes user input by removing special characters
 * @param {string} name - User input string
 * @param {number} maxLength - Maximum allowed length
 * @returns {string} Sanitized string
 */
export const sanitizeName = (name, maxLength = 20) => {
  if (typeof name !== 'string') return '';
  return name.replace(/[^a-zA-Z0-9 ]/g, '').slice(0, maxLength).trim();
};

/**
 * Sanitizes task titles and descriptions
 * @param {string} text - User input text
 * @param {number} maxLength - Maximum allowed length
 * @returns {string} Sanitized text
 */
export const sanitizeText = (text, maxLength = 100) => {
  if (typeof text !== 'string') return '';
  // Allow basic punctuation but strip potentially dangerous characters
  return text
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .slice(0, maxLength)
    .trim();
};

/**
 * Validates email format
 * @param {string} email - Email address
 * @returns {boolean} True if valid
 */
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Creates a simple hash for mock password storage
 * @param {string} password - Plain password
 * @returns {string} Hashed password
 */
export const hashPassword = (password) => {
  // Simple hash for MVP - in production use bcrypt
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString();
};
