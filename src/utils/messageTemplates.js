/**
 * Message Templates — GarageSathi
 *
 * Reusable WhatsApp message generator helpers.
 * All message builders are stored here to keep components clean.
 *
 * Usage:
 *   import { buildReceivedMessage } from '@/utils/messageTemplates';
 *   const msg = buildReceivedMessage(service, garageName);
 *   openWhatsApp(phone, msg);
 */

const FALLBACK_GARAGE_NAME = 'GarageSathi Partner Garage';

/**
 * Build "Vehicle Received" message.
 * @param {object} service - Service record
 * @param {string} garageName - Garage name from settings
 * @returns {string}
 */
export function buildReceivedMessage(service, garageName) {
  const garage = garageName || FALLBACK_GARAGE_NAME;
  return `Hello ${service.customerName || 'Customer'},

Your vehicle ${service.vehicleNumber || '-'} has been received at ${garage}.

Current KM:
${service.odometer ? service.odometer.toLocaleString('en-IN') + ' km' : 'Not recorded'}

Reported Issue:
${service.problemDescription || 'Not specified'}

We will inspect the vehicle and update you shortly.

Thank you.`;
}

/**
 * Build "Inspection Report" message.
 * @param {object} service - Service record
 * @param {string} garageName - Garage name from settings
 * @returns {string}
 */
export function buildInspectionReportMessage(service, garageName) {
  const garage = garageName || FALLBACK_GARAGE_NAME;
  return `Hello ${service.customerName || 'Customer'},

After inspection of vehicle ${service.vehicleNumber || '-'}, we found:

${service.workNotes || 'Inspection notes not yet added.'}

Estimated Cost:
₹${service.estimatedCost || 0}

Please review the findings.

Thank you.

— ${garage}`;
}

/**
 * Build "Approval Request" message.
 * @param {object} service - Service record
 * @param {string} garageName - Garage name from settings
 * @returns {string}
 */
export function buildApprovalRequestMessage(service, garageName) {
  const garage = garageName || FALLBACK_GARAGE_NAME;
  return `Hello ${service.customerName || 'Customer'},

After inspection of vehicle ${service.vehicleNumber || '-'}, we found:

${service.workNotes || 'Inspection notes not yet added.'}

Estimated Repair Cost:
₹${service.estimatedCost || 0}

Please reply:

✅ YES - Approve Repair
❌ NO - Do Not Proceed

Thank you.

— ${garage}`;
}

/**
 * Build "Work Started" message.
 * @param {object} service - Service record
 * @param {string} garageName - Garage name from settings
 * @returns {string}
 */
export function buildWorkStartedMessage(service, garageName) {
  const garage = garageName || FALLBACK_GARAGE_NAME;
  return `Hello ${service.customerName || 'Customer'},

Repair work has started on your vehicle ${service.vehicleNumber || '-'}.

Approved Estimate:
₹${service.estimatedCost || 0}

We will notify you once work is completed.

Thank you.

— ${garage}`;
}

/**
 * Build "Ready For Pickup" message.
 * @param {object} service - Service record
 * @param {string} garageName - Garage name from settings
 * @returns {string}
 */
export function buildReadyForPickupMessage(service, garageName) {
  const garage = garageName || FALLBACK_GARAGE_NAME;
  const labor = service.laborCharge || 0;
  const parts = service.partsCharge || 0;
  const finalAmount = labor + parts;
  return `Hello ${service.customerName || 'Customer'},

Your vehicle ${service.vehicleNumber || '-'} is ready for pickup. 🎉

Work Completed:
${service.workNotes || 'Service completed successfully.'}

Final Amount:
₹${finalAmount}

Thank you for choosing ${garage}.`;
}

/**
 * Build "Invoice Summary" message.
 * @param {object} service - Service record with invoice fields
 * @param {string} garageName - Garage name from settings
 * @returns {string}
 */
export function buildInvoiceSummaryMessage(service, garageName) {
  const garage = garageName || FALLBACK_GARAGE_NAME;
  const labor = service.laborCharge || 0;
  const parts = service.partsCharge || 0;
  const totalAmount = service.totalAmount || (labor + parts);
  const paymentStatusLabel =
    service.paymentStatus === 'paid'
      ? '✅ Paid'
      : service.paymentStatus === 'partial'
      ? '⚠️ Partially Paid'
      : '🔴 Pending';

  return `Hello ${service.customerName || 'Customer'},

Invoice Number:
${service.invoiceNumber || 'Not yet generated'}

Vehicle:
${service.vehicleNumber || '-'}

Total Amount:
₹${totalAmount}

Payment Status:
${paymentStatusLabel}

Thank you for visiting ${garage}.`;
}
