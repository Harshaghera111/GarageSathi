/**
 * WhatsApp Utility — GarageSathi
 *
 * Uses wa.me deep-link approach (free, no API needed).
 * Opens WhatsApp with pre-filled message.
 * Works on both mobile and desktop.
 */

import { getCleanPhone } from './formatters';

/**
 * Open WhatsApp chat with a contact.
 * @param {string} phone - Phone number (any format)
 * @param {string} message - Pre-filled message (optional)
 */
export function openWhatsApp(phone, message = '') {
  const cleanPhone = getCleanPhone(phone);
  const encodedMessage = encodeURIComponent(message);
  const url = `https://wa.me/${cleanPhone}${message ? `?text=${encodedMessage}` : ''}`;
  window.open(url, '_blank');
}

/**
 * Share service details on WhatsApp.
 * @param {string} phone - Customer phone
 * @param {object} service - Service record
 */
export function shareServiceOnWhatsApp(phone, service) {
  const message = `🔧 *GarageSathi — Service Update*

Vehicle: ${service.vehicleNumber || ''} (${service.vehicleModel || ''})
Service: ${service.serviceType || 'General'}
Status: ${service.status || 'In Progress'}
${service.totalAmount ? `Amount: ₹${service.totalAmount}` : ''}

Thank you for choosing our garage! 🙏`;

  openWhatsApp(phone, message);
}

/**
 * Share invoice on WhatsApp.
 * @param {string} phone - Customer phone
 * @param {object} invoice - Invoice data
 */
export function shareInvoiceOnWhatsApp(phone, invoice, serviceType = 'General Service') {
  const statusLabel = invoice.paymentStatus === 'paid' ? 'Paid' : 'Pending';
  const message = `Invoice #${invoice.invoiceNumber || ''}

Vehicle: ${invoice.vehicleInfo?.vehicleNumber || ''}
Service: ${serviceType}

Labor: ₹${invoice.laborCharge || 0}
Parts: ₹${invoice.partsCharge || 0}

Total: ₹${invoice.totalAmount || 0}

Payment Status: ${statusLabel}`;

  openWhatsApp(phone, message);
}

/**
 * Send service reminder on WhatsApp.
 * @param {string} phone - Customer phone
 * @param {object} reminder - Reminder data
 */
export function sendReminderOnWhatsApp(phone, reminder) {
  const message = `🔔 *GarageSathi — Service Reminder*

Hi ${reminder.customerName || 'there'}!

Your ${reminder.type || 'service'} for vehicle ${reminder.vehicleNumber || ''} is due${reminder.dueDate ? ` on ${reminder.dueDate}` : ' soon'}.

Please visit our garage at your convenience.

Book now to avoid last-minute rush! 🏍️`;

  openWhatsApp(phone, message);
}
