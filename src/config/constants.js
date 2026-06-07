/**
 * Application Constants — GarageSathi
 *
 * All enums, status values, and reference data used across the app.
 * Keeping these centralized prevents typos and makes updates easy.
 */

// ====================================
// User Roles
// ====================================
export const USER_ROLES = {
  SUPER_ADMIN: 'super_admin',
  GARAGE_OWNER: 'garage_owner',
  MECHANIC: 'mechanic',
  CUSTOMER: 'customer',
};

// ====================================
// Service Status — Workflow order
// ====================================
export const SERVICE_STATUS = {
  RECEIVED: 'received',
  IN_PROGRESS: 'in_progress',
  WAITING_PARTS: 'waiting_parts',
  COMPLETED: 'completed',
  DELIVERED: 'delivered',
};

// Human-readable labels for service status
export const SERVICE_STATUS_LABELS = {
  received: 'Received',
  in_progress: 'In Progress',
  waiting_parts: 'Waiting for Parts',
  completed: 'Completed',
  delivered: 'Delivered',
};

// Colors for service status badges
export const SERVICE_STATUS_COLORS = {
  received: 'info',
  in_progress: 'warning',
  waiting_parts: 'error',
  completed: 'success',
  delivered: 'neutral',
};

// ====================================
// Service Types — Common in Indian garages
// ====================================
export const SERVICE_TYPES = {
  REGULAR_SERVICE: 'regular_service',
  OIL_CHANGE: 'oil_change',
  REPAIR: 'repair',
  TIRE: 'tire',
  BATTERY: 'battery',
  ELECTRICAL: 'electrical',
  BODY_WORK: 'body_work',
  BRAKE: 'brake',
  CHAIN_SPROCKET: 'chain_sprocket',
  OTHER: 'other',
};

export const SERVICE_TYPE_LABELS = {
  regular_service: 'Regular Service',
  oil_change: 'Oil Change',
  repair: 'Repair',
  tire: 'Tire Change/Repair',
  battery: 'Battery',
  electrical: 'Electrical',
  body_work: 'Body Work',
  brake: 'Brake Service',
  chain_sprocket: 'Chain & Sprocket',
  other: 'Other',
};

// ====================================
// Payment Status
// ====================================
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PARTIAL: 'partial',
  PAID: 'paid',
};

export const PAYMENT_STATUS_LABELS = {
  pending: 'Pending',
  partial: 'Partial',
  paid: 'Paid',
};

export const PAYMENT_STATUS_COLORS = {
  pending: 'error',
  partial: 'warning',
  paid: 'success',
};

// ====================================
// Approval Status — Customer Repair Authorization
// ====================================
export const APPROVAL_STATUS = {
  NOT_REQUIRED: 'not_required',
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

export const APPROVAL_STATUS_LABELS = {
  not_required: 'Not Required',
  pending: 'Pending Approval',
  approved: 'Approved',
  rejected: 'Rejected',
};

export const APPROVAL_STATUS_COLORS = {
  not_required: 'neutral',
  pending: 'warning',
  approved: 'success',
  rejected: 'error',
};

// ====================================
// Payment Methods — India specific
// ====================================
export const PAYMENT_METHODS = {
  CASH: 'cash',
  UPI: 'upi',
  CARD: 'card',
  ONLINE: 'online',
};

export const PAYMENT_METHOD_LABELS = {
  cash: 'Cash',
  upi: 'UPI',
  card: 'Card',
  online: 'Online',
};

// ====================================
// Vehicle Engine Types
// ====================================
export const ENGINE_TYPES = {
  PETROL: 'petrol',
  DIESEL: 'diesel',
  ELECTRIC: 'electric',
};

// ====================================
// Popular Indian Bike/Scooter Models
// Used in dropdowns for quick selection
// ====================================
export const POPULAR_VEHICLE_MODELS = [
  // Hero
  'Hero Splendor Plus',
  'Hero HF Deluxe',
  'Hero Passion Pro',
  'Hero Glamour',
  'Hero Xtreme 160R',
  'Hero Xpulse 200',
  'Hero Pleasure Plus',
  'Hero Destini 125',
  // Honda
  'Honda Activa 6G',
  'Honda Shine',
  'Honda SP 125',
  'Honda Unicorn',
  'Honda CB Hornet',
  'Honda Dio',
  'Honda Grazia',
  // Bajaj
  'Bajaj Pulsar 150',
  'Bajaj Pulsar NS200',
  'Bajaj Pulsar RS200',
  'Bajaj Platina',
  'Bajaj CT 110',
  'Bajaj Dominar 400',
  'Bajaj Avenger',
  'Bajaj Chetak EV',
  // TVS
  'TVS Apache RTR 160',
  'TVS Apache RTR 200',
  'TVS Jupiter',
  'TVS NTorq',
  'TVS Star City Plus',
  'TVS Raider',
  'TVS iQube Electric',
  // Royal Enfield
  'Royal Enfield Classic 350',
  'Royal Enfield Bullet 350',
  'Royal Enfield Meteor 350',
  'Royal Enfield Hunter 350',
  'Royal Enfield Himalayan',
  // Yamaha
  'Yamaha FZ-S V3',
  'Yamaha MT-15',
  'Yamaha R15 V4',
  'Yamaha Ray ZR',
  'Yamaha Fascino',
  // Suzuki
  'Suzuki Gixxer 150',
  'Suzuki Access 125',
  'Suzuki Burgman Street',
  // KTM
  'KTM Duke 200',
  'KTM Duke 390',
  'KTM RC 200',
  // Ola/Ather (Electric)
  'Ola S1 Pro',
  'Ola S1 Air',
  'Ather 450X',
  // Other
  'Other',
];

// ====================================
// Firestore Collection Paths
// ====================================
export const COLLECTIONS = {
  USERS: 'users',
  GARAGES: 'garages',
  // Subcollections under garages/{garageId}/
  CUSTOMERS: 'customers',
  SERVICES: 'services',
  INVOICES: 'invoices',
  REMINDERS: 'reminders',
  NOTIFICATIONS: 'notifications',
};

// ====================================
// App Defaults
// ====================================
export const DEFAULTS = {
  PAGE_SIZE: 20,
  CURRENCY: '₹',
  COUNTRY_CODE: '+91',
  GST_RATE: 18, // 18% GST
};
