/**
 * Settings Service — GarageSathi
 *
 * Scoped under garages/{garageId}/settings/profile.
 */

import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';

const SETTINGS_COLLECTION = 'settings';
const PROFILE_DOC = 'profile';

export const DEFAULT_SETTINGS = {
  garageName: 'My Garage',
  ownerName: 'Garage Owner',
  phone: '',
  whatsapp: '',
  email: '',
  address: '',
  city: '',
  state: '',
  pinCode: '',
  logoUrl: '',
  primaryColor: '#3B82F6', // Blue default
  invoicePrefix: 'INV',
  currencySymbol: '₹',
  defaultTaxPercentage: 0,
  showTaxOnInvoice: false,
  showLogoOnInvoice: false,
};

/**
 * Fetch settings for a garage.
 * Returns default settings if none exist yet.
 */
export async function getSettings(garageId) {
  const ref = doc(db, 'garages', garageId, SETTINGS_COLLECTION, PROFILE_DOC);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    return { ...DEFAULT_SETTINGS, ...snap.data() };
  }
  return { ...DEFAULT_SETTINGS };
}

/**
 * Update settings for a garage.
 */
export async function updateSettings(garageId, settingsData) {
  const ref = doc(db, 'garages', garageId, SETTINGS_COLLECTION, PROFILE_DOC);
  await setDoc(ref, {
    ...settingsData,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}
