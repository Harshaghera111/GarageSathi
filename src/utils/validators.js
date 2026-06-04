/**
 * Form Validators — GarageSathi
 *
 * Simple validation helpers for Indian phone numbers,
 * vehicle registration, email, and form fields.
 */

/**
 * Validate Indian mobile number (10 digits, starts with 6-9).
 * @param {string} phone
 * @returns {string|null} Error message or null if valid
 */
export function validatePhone(phone) {
  if (!phone) return 'Phone number is required';
  const digits = phone.replace(/\D/g, '');
  const last10 = digits.slice(-10);
  if (last10.length !== 10) return 'Phone number must be 10 digits';
  if (!/^[6-9]/.test(last10)) return 'Phone number must start with 6, 7, 8, or 9';
  return null;
}

/**
 * Validate Indian vehicle registration number.
 * Formats: KA01AB1234, KA 01 AB 1234, ka01ab1234
 * @param {string} number
 * @returns {string|null} Error message or null if valid
 */
export function validateVehicleNumber(number) {
  if (!number) return 'Vehicle number is required';
  const clean = number.replace(/\s/g, '').toUpperCase();
  // Basic Indian format: 2 letters + 2 digits + 1-3 letters + 1-4 digits
  const pattern = /^[A-Z]{2}\d{1,2}[A-Z]{1,3}\d{1,4}$/;
  if (!pattern.test(clean)) return 'Enter a valid vehicle number (e.g., KA01AB1234)';
  return null;
}

/**
 * Validate email address.
 * @param {string} email
 * @returns {string|null} Error message or null if valid
 */
export function validateEmail(email) {
  if (!email) return 'Email is required';
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!pattern.test(email)) return 'Enter a valid email address';
  return null;
}

/**
 * Validate required field.
 * @param {string} value
 * @param {string} fieldName
 * @returns {string|null}
 */
export function validateRequired(value, fieldName = 'This field') {
  if (!value || !value.trim()) return `${fieldName} is required`;
  return null;
}

/**
 * Validate password strength.
 * @param {string} password
 * @returns {string|null}
 */
export function validatePassword(password) {
  if (!password) return 'Password is required';
  if (password.length < 6) return 'Password must be at least 6 characters';
  return null;
}

/**
 * Validate a positive number.
 * @param {number|string} value
 * @param {string} fieldName
 * @returns {string|null}
 */
export function validatePositiveNumber(value, fieldName = 'Amount') {
  if (value === '' || value === null || value === undefined) return `${fieldName} is required`;
  const num = Number(value);
  if (isNaN(num)) return `${fieldName} must be a number`;
  if (num < 0) return `${fieldName} cannot be negative`;
  return null;
}
