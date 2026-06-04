/**
 * Formatters — GarageSathi
 *
 * India-specific formatting utilities for currency, dates, phone numbers,
 * and vehicle registration numbers.
 */

import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';

// ====================================
// Currency Formatting (Indian Rupees)
// ====================================

/**
 * Format a number as Indian Rupees.
 * Uses Indian numbering system (12,34,567).
 * @param {number} amount - The amount to format
 * @returns {string} Formatted currency string (e.g., "₹12,345")
 */
export function formatCurrency(amount) {
  if (amount === null || amount === undefined) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format currency with paise (decimal).
 * @param {number} amount
 * @returns {string} e.g., "₹1,234.50"
 */
export function formatCurrencyDecimal(amount) {
  if (amount === null || amount === undefined) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// ====================================
// Date Formatting
// ====================================

/**
 * Format a Firestore timestamp or Date to a readable string.
 * @param {Date|{seconds: number}|null} date - Firestore timestamp or JS Date
 * @returns {string} Formatted date (e.g., "28 May 2026")
 */
export function formatDate(date) {
  if (!date) return '-';
  const d = date?.seconds ? new Date(date.seconds * 1000) : new Date(date);
  return format(d, 'dd MMM yyyy');
}

/**
 * Format date with time.
 * @param {Date|{seconds: number}|null} date
 * @returns {string} e.g., "28 May 2026, 5:30 PM"
 */
export function formatDateTime(date) {
  if (!date) return '-';
  const d = date?.seconds ? new Date(date.seconds * 1000) : new Date(date);
  return format(d, 'dd MMM yyyy, h:mm a');
}

/**
 * Format date as relative time for activity feeds.
 * @param {Date|{seconds: number}|null} date
 * @returns {string} e.g., "2 hours ago", "Yesterday", "28 May"
 */
export function formatRelativeDate(date) {
  if (!date) return '-';
  const d = date?.seconds ? new Date(date.seconds * 1000) : new Date(date);

  if (isToday(d)) {
    return formatDistanceToNow(d, { addSuffix: true });
  }
  if (isYesterday(d)) {
    return 'Yesterday';
  }
  return format(d, 'dd MMM');
}

/**
 * Format date for display in short form.
 * @param {Date|{seconds: number}|null} date
 * @returns {string} e.g., "28/05/2026"
 */
export function formatDateShort(date) {
  if (!date) return '-';
  const d = date?.seconds ? new Date(date.seconds * 1000) : new Date(date);
  return format(d, 'dd/MM/yyyy');
}

// ====================================
// Phone Number Formatting
// ====================================

/**
 * Format Indian phone number.
 * @param {string} phone - Phone number (10 digits)
 * @returns {string} Formatted phone (e.g., "+91 98765 43210")
 */
export function formatPhone(phone) {
  if (!phone) return '-';
  // Remove any non-digit characters
  const digits = phone.replace(/\D/g, '');
  // Get last 10 digits (remove country code if present)
  const last10 = digits.slice(-10);
  if (last10.length !== 10) return phone;
  return `+91 ${last10.slice(0, 5)} ${last10.slice(5)}`;
}

/**
 * Get clean 10-digit phone number for WhatsApp links.
 * @param {string} phone
 * @returns {string} e.g., "919876543210"
 */
export function getCleanPhone(phone) {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  const last10 = digits.slice(-10);
  return `91${last10}`;
}

// ====================================
// Vehicle Number Formatting
// ====================================

/**
 * Format Indian vehicle registration number.
 * @param {string} number - Vehicle number
 * @returns {string} Formatted (e.g., "KA 01 AB 1234")
 */
export function formatVehicleNumber(number) {
  if (!number) return '-';
  // Remove spaces and convert to uppercase
  const clean = number.replace(/\s/g, '').toUpperCase();
  if (clean.length < 8) return clean;
  // Format as: XX 00 XX 0000
  return `${clean.slice(0, 2)} ${clean.slice(2, 4)} ${clean.slice(4, 6)} ${clean.slice(6)}`;
}

// ====================================
// Invoice Number Formatting
// ====================================

/**
 * Generate invoice number.
 * Format: GS-YYYY-NNNN
 * @param {number} sequence - Sequential number
 * @returns {string} e.g., "GS-2026-0042"
 */
export function generateInvoiceNumber(sequence) {
  const year = new Date().getFullYear();
  const num = String(sequence).padStart(4, '0');
  return `GS-${year}-${num}`;
}

// ====================================
// General Utilities
// ====================================

/**
 * Truncate text with ellipsis.
 * @param {string} text
 * @param {number} maxLength
 * @returns {string}
 */
export function truncate(text, maxLength = 30) {
  if (!text) return '';
  return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
}

/**
 * Get initials from a name (for avatars).
 * @param {string} name
 * @returns {string} e.g., "RS" for "Rahul Sharma"
 */
export function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}
