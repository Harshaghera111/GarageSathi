/**
 * Service Service — GarageSathi
 *
 * Firestore CRUD operations for service records.
 * Scoped under garages/{garageId}/services.
 */

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  getCountFromServer,
  query,
  orderBy,
  limit,
  startAfter,
  where,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { COLLECTIONS, DEFAULTS } from '@/config/constants';

/**
 * Get the services collection reference for a garage.
 */
function getServicesRef(garageId) {
  return collection(db, COLLECTIONS.GARAGES, garageId, COLLECTIONS.SERVICES);
}

/**
 * Create a new service record.
 * @param {string} garageId
 * @param {object} serviceData
 * @returns {string} New service document ID
 */
export async function createService(garageId, serviceData) {
  const ref = getServicesRef(garageId);
  const docRef = await addDoc(ref, {
    ...serviceData,
    partsUsed: serviceData.partsUsed || [],
    paymentStatus: 'pending',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

/**
 * Update a service record.
 * @param {string} garageId
 * @param {string} serviceId
 * @param {object} updates
 */
export async function updateService(garageId, serviceId, updates) {
  const ref = doc(db, COLLECTIONS.GARAGES, garageId, COLLECTIONS.SERVICES, serviceId);
  await updateDoc(ref, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Get a single service by ID.
 * @param {string} garageId
 * @param {string} serviceId
 * @returns {object|null}
 */
export async function getService(garageId, serviceId) {
  const ref = doc(db, COLLECTIONS.GARAGES, garageId, COLLECTIONS.SERVICES, serviceId);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    return { id: snap.id, ...snap.data() };
  }
  return null;
}

/**
 * Get services with optional status filter and pagination.
 * @param {string} garageId
 * @param {object} options - { status, pageSize, lastDoc }
 * @returns {object} { services, lastDoc, hasMore }
 */
export async function getServices(garageId, options = {}) {
  const { status = null, pageSize = DEFAULTS.PAGE_SIZE, lastDoc = null } = options;
  const ref = getServicesRef(garageId);

  const constraints = [];
  if (status) {
    constraints.push(where('status', '==', status));
  }
  constraints.push(orderBy('createdAt', 'desc'));
  // C1 FIX: startAfter must appear before limit in the constraints array.
  // Firestore query evaluation order: filter → sort → cursor → limit.
  if (lastDoc) {
    constraints.push(startAfter(lastDoc));
  }
  constraints.push(limit(pageSize));

  const q = query(ref, ...constraints);
  const snap = await getDocs(q);
  const services = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  const last = snap.docs[snap.docs.length - 1] || null;

  return {
    services,
    lastDoc: last,
    hasMore: snap.docs.length === pageSize,
  };
}

/**
 * Get today's services.
 * @param {string} garageId
 * @returns {Array}
 */
export async function getTodayServices(garageId) {
  const ref = getServicesRef(garageId);
  // H1 FIX: Use Timestamp.fromDate() instead of a raw JS Date object.
  // Firestore stores timestamps as Timestamp objects; comparing with a plain
  // Date causes a type mismatch that can silently return zero results.
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTimestamp = Timestamp.fromDate(today);

  const q = query(
    ref,
    where('createdAt', '>=', todayTimestamp),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

/**
 * Get services for a specific customer.
 * @param {string} garageId
 * @param {string} customerId
 * @returns {Array}
 */
export async function getCustomerServices(garageId, customerId) {
  const ref = getServicesRef(garageId);
  const q = query(
    ref,
    where('customerId', '==', customerId),
    orderBy('createdAt', 'desc'),
    limit(50)
  );
  const snap = await getDocs(q);
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

/**
 * Search services by customer name, vehicle number, model, service type, or mechanic.
 * MVP client-side search strategy. For production, scale with Algolia/Elasticsearch.
 *
 * @param {string} garageId
 * @param {string} searchTerm
 * @returns {Array} Matching service records
 */
export async function searchServices(garageId, searchTerm) {
  const ref = getServicesRef(garageId);
  const q = query(ref, orderBy('createdAt', 'desc'), limit(100));
  const snap = await getDocs(q);

  const term = searchTerm.toLowerCase();
  return snap.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .filter(
      (s) =>
        s.customerName?.toLowerCase().includes(term) ||
        s.vehicleNumber?.toLowerCase().includes(term) ||
        s.vehicleModel?.toLowerCase().includes(term) ||
        s.serviceType?.toLowerCase().includes(term) ||
        s.assignedMechanic?.toLowerCase().includes(term)
    );
}

/**
 * Get pending services count.
 * @param {string} garageId
 * @returns {number}
 */
export async function getPendingServicesCount(garageId) {
  const ref = getServicesRef(garageId);
  const q = query(
    ref,
    where('status', 'in', ['received', 'in_progress', 'waiting_parts'])
  );
  const snap = await getCountFromServer(q);
  return snap.data().count;
}

/**
 * Get completed services count.
 * @param {string} garageId
 * @returns {number}
 */
export async function getCompletedServicesCount(garageId) {
  const ref = getServicesRef(garageId);
  const q = query(
    ref,
    where('status', 'in', ['completed', 'delivered'])
  );
  const snap = await getCountFromServer(q);
  return snap.data().count;
}

/**
 * Get revenue summary (total of completed/delivered services).
 * For MVP, we calculate client-side. For scale, use Cloud Functions.
 * @param {string} garageId
 * @returns {object} { total, thisMonth, today }
 */
export async function getRevenueSummary(garageId) {
  const ref = getServicesRef(garageId);
  const q = query(
    ref,
    where('paymentStatus', 'in', ['paid', 'partial']),
    orderBy('createdAt', 'desc'),
    limit(500) // Reasonable limit for MVP
  );
  const snap = await getDocs(q);
  const services = snap.docs.map((doc) => doc.data());

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  let total = 0;
  let thisMonth = 0;
  let today = 0;

  services.forEach((s) => {
    const amount = s.finalAmount || s.totalAmount || 0;
    total += amount;

    if (s.createdAt?.seconds) {
      const date = new Date(s.createdAt.seconds * 1000);
      if (date >= startOfMonth) thisMonth += amount;
      if (date >= startOfDay) today += amount;
    }
  });

  return { total, thisMonth, today };
}
