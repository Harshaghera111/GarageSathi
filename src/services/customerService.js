/**
 * Customer Service — GarageSathi
 *
 * Firestore CRUD operations for customers.
 * All customers are scoped under garages/{garageId}/customers.
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
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { COLLECTIONS, DEFAULTS } from '@/config/constants';

/**
 * Get the customers collection reference for a garage.
 * @param {string} garageId
 * @returns {CollectionReference}
 */
function getCustomersRef(garageId) {
  return collection(db, COLLECTIONS.GARAGES, garageId, COLLECTIONS.CUSTOMERS);
}

/**
 * Add a new customer.
 * @param {string} garageId
 * @param {object} customerData
 * @returns {string} New customer document ID
 */
export async function addCustomer(garageId, customerData) {
  const ref = getCustomersRef(garageId);
  const docRef = await addDoc(ref, {
    ...customerData,
    totalServices: 0,
    totalSpent: 0,
    isActive: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

/**
 * Update an existing customer.
 * @param {string} garageId
 * @param {string} customerId
 * @param {object} updates
 */
export async function updateCustomer(garageId, customerId, updates) {
  const ref = doc(db, COLLECTIONS.GARAGES, garageId, COLLECTIONS.CUSTOMERS, customerId);
  await updateDoc(ref, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Get a single customer by ID.
 * @param {string} garageId
 * @param {string} customerId
 * @returns {object|null}
 */
export async function getCustomer(garageId, customerId) {
  const ref = doc(db, COLLECTIONS.GARAGES, garageId, COLLECTIONS.CUSTOMERS, customerId);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    return { id: snap.id, ...snap.data() };
  }
  return null;
}

/**
 * Get all customers with pagination.
 * @param {string} garageId
 * @param {object} options - { pageSize, lastDoc }
 * @returns {object} { customers, lastDoc, hasMore }
 */
export async function getCustomers(garageId, options = {}) {
  const { pageSize = DEFAULTS.PAGE_SIZE, lastDoc = null, sortBy = 'createdAt', sortOrder = 'desc' } = options;
  const ref = getCustomersRef(garageId);

  let q = query(
    ref,
    where('isActive', '==', true),
    orderBy(sortBy, sortOrder),
    limit(pageSize)
  );

  if (lastDoc) {
    q = query(
      ref,
      where('isActive', '==', true),
      orderBy(sortBy, sortOrder),
      startAfter(lastDoc),
      limit(pageSize)
    );
  }

  const snap = await getDocs(q);
  const customers = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  const last = snap.docs[snap.docs.length - 1] || null;

  return {
    customers,
    lastDoc: last,
    hasMore: snap.docs.length === pageSize,
  };
}

/**
 * Search customers by name or phone.
 * Note: Firestore doesn't support full-text search natively.
 * For MVP, we fetch all customers and filter client-side.
 * For production scale, use Algolia or Firebase Extensions.
 *
 * @param {string} garageId
 * @param {string} searchTerm
 * @returns {Array} Matching customers
 */
export async function searchCustomers(garageId, searchTerm) {
  const ref = getCustomersRef(garageId);
  const q = query(
    ref,
    where('isActive', '==', true),
    orderBy('createdAt', 'desc'),
    limit(100)
  );
  const snap = await getDocs(q);

  const term = searchTerm.toLowerCase();
  return snap.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .filter(
      (c) =>
        c.name?.toLowerCase().includes(term) ||
        c.phone?.includes(term) ||
        c.vehicles?.some((v) =>
          v.vehicleNumber?.toLowerCase().includes(term) ||
          v.model?.toLowerCase().includes(term)
        )
    );
}

/**
 * Delete a customer (soft delete — set isActive to false).
 * @param {string} garageId
 * @param {string} customerId
 */
export async function deleteCustomer(garageId, customerId) {
  const ref = doc(db, COLLECTIONS.GARAGES, garageId, COLLECTIONS.CUSTOMERS, customerId);
  await updateDoc(ref, {
    isActive: false,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Get total customer count (approximate).
 * @param {string} garageId
 * @returns {number}
 */
export async function getCustomerCount(garageId) {
  const ref = getCustomersRef(garageId);
  const q = query(ref, where('isActive', '==', true));
  const snap = await getCountFromServer(q);
  return snap.data().count;
}
