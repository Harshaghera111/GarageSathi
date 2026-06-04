/**
 * Invoice Service — GarageSathi
 *
 * Firestore CRUD for invoices.
 * Scoped under garages/{garageId}/invoices.
 */

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  orderBy,
  limit,
  startAfter,
  where,
  serverTimestamp,
  runTransaction,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { COLLECTIONS, DEFAULTS } from '@/config/constants';

function getInvoicesRef(garageId) {
  return collection(db, COLLECTIONS.GARAGES, garageId, COLLECTIONS.INVOICES);
}

/**
 * Create a new invoice.
 * R1: Uses Firestore transaction to guarantee sequential unique invoice numbers.
 * R2: Performs check to block duplicate invoices for the same serviceId.
 */
export async function createInvoice(garageId, invoiceData) {
  const ref = getInvoicesRef(garageId);

  // R2: Duplicate Invoice Protection
  if (invoiceData.serviceId) {
    const q = query(ref, where('serviceId', '==', invoiceData.serviceId), limit(1));
    const existingSnap = await getDocs(q);
    if (!existingSnap.empty) {
      const existingDoc = existingSnap.docs[0];
      const err = new Error('Invoice already exists for this service.');
      err.code = 'ALREADY_EXISTS';
      err.invoiceId = existingDoc.id;
      throw err;
    }
  }

  // R1: Transaction-safe invoice number generation
  const counterRef = doc(db, COLLECTIONS.GARAGES, garageId, 'metadata', 'counters');
  const settingsRef = doc(db, COLLECTIONS.GARAGES, garageId, 'settings', 'profile');
  
  // Allocate new document ID before transaction runs
  const newInvoiceRef = doc(collection(db, COLLECTIONS.GARAGES, garageId, COLLECTIONS.INVOICES));
  const serviceRef = invoiceData.serviceId 
    ? doc(db, COLLECTIONS.GARAGES, garageId, COLLECTIONS.SERVICES, invoiceData.serviceId)
    : null;

  let invoiceNumber = '';

  await runTransaction(db, async (transaction) => {
    // 1. Get the current counter value & custom prefix
    const counterSnap = await transaction.get(counterRef);
    const settingsSnap = await transaction.get(settingsRef);
    
    let count = 1;
    if (counterSnap.exists()) {
      count = (counterSnap.data().invoiceCounter || 0) + 1;
    }

    const prefix = settingsSnap.exists() ? settingsSnap.data().invoicePrefix || 'INV' : 'INV';

    // 2. Generate invoice number (PREFIX-YYYY-XXXX)
    const year = new Date().getFullYear();
    invoiceNumber = `${prefix}-${year}-${String(count).padStart(4, '0')}`;

    // 3. Update the counter document atomically
    transaction.set(counterRef, { invoiceCounter: count }, { merge: true });

    // 4. Create the invoice document
    transaction.set(newInvoiceRef, {
      ...invoiceData,
      invoiceNumber,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // 5. Update the associated service status
    if (serviceRef) {
      transaction.update(serviceRef, {
        paymentStatus: invoiceData.paymentStatus || 'pending',
        invoiceId: newInvoiceRef.id,
        invoiceNumber: invoiceNumber,
        updatedAt: serverTimestamp(),
      });
    }
  });

  return { id: newInvoiceRef.id, invoiceNumber };
}

/**
 * Get a single invoice by ID.
 */
export async function getInvoice(garageId, invoiceId) {
  const ref = doc(db, COLLECTIONS.GARAGES, garageId, COLLECTIONS.INVOICES, invoiceId);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    return { id: snap.id, ...snap.data() };
  }
  return null;
}

/**
 * Get all invoices for a garage (paginated).
 */
export async function getInvoices(garageId, options = {}) {
  const { pageSize = DEFAULTS.PAGE_SIZE || 20, lastDoc = null, status = 'all' } = options;
  const ref = getInvoicesRef(garageId);

  const constraints = [];
  if (status && status !== 'all') {
    constraints.push(where('paymentStatus', '==', status));
  }
  constraints.push(orderBy('createdAt', 'desc'));

  if (lastDoc) {
    constraints.push(startAfter(lastDoc));
  }
  constraints.push(limit(pageSize));

  const q = query(ref, ...constraints);
  const snap = await getDocs(q);
  const invoices = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  return {
    invoices,
    lastDoc: snap.docs[snap.docs.length - 1] || null,
    hasMore: snap.docs.length === pageSize,
  };
}

/**
 * Search invoices by invoiceNumber, customer name, or vehicle number.
 * MVP client-side search strategy fetching the latest 100 invoices.
 */
export async function searchInvoices(garageId, searchTerm) {
  const ref = getInvoicesRef(garageId);
  const q = query(ref, orderBy('createdAt', 'desc'), limit(100));
  const snap = await getDocs(q);

  const term = searchTerm.toLowerCase();
  return snap.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .filter(
      (inv) =>
        inv.invoiceNumber?.toLowerCase().includes(term) ||
        inv.customerInfo?.name?.toLowerCase().includes(term) ||
        inv.vehicleInfo?.vehicleNumber?.toLowerCase().includes(term)
    );
}

/**
 * Update invoice (e.g., mark as paid).
 */
export async function updateInvoice(garageId, invoiceId, updates) {
  const ref = doc(db, COLLECTIONS.GARAGES, garageId, COLLECTIONS.INVOICES, invoiceId);
  await updateDoc(ref, {
    ...updates,
    updatedAt: serverTimestamp(),
  });

  // If the invoice is associated with a service, also update the service's paymentStatus
  const snap = await getDoc(ref);
  if (snap.exists()) {
    const data = snap.data();
    if (data.serviceId && updates.paymentStatus) {
      const serviceRef = doc(db, COLLECTIONS.GARAGES, garageId, COLLECTIONS.SERVICES, data.serviceId);
      await updateDoc(serviceRef, {
        paymentStatus: updates.paymentStatus,
        updatedAt: serverTimestamp(),
      });
    }
  }
}
