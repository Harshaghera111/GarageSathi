/**
 * Photo Service — GarageSathi Phase 3
 *
 * Manages vehicle condition photo uploads to Firebase Storage.
 * Storage path: garages/{garageId}/services/{serviceId}/{type}/{uuid}.{ext}
 *
 * IMPORTANT: Images are stored in Firebase Storage ONLY.
 * Firestore stores only the URL + metadata (url, path, uploadedAt).
 */

import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { storage, db } from '@/config/firebase';
import { COLLECTIONS } from '@/config/constants';

// ============================================================
// Constants
// ============================================================

/** Allowed MIME types for vehicle photos */
export const ALLOWED_PHOTO_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];

/** Maximum file size per photo: 5 MB */
export const MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024;

/** Maximum number of photos per type (before / after) */
export const MAX_PHOTOS_PER_TYPE = 10;

// ============================================================
// Validation
// ============================================================

/**
 * Validate a single file before upload.
 * @param {File} file
 * @returns {{ valid: boolean, error: string|null }}
 */
export function validatePhotoFile(file) {
  if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `"${file.name}" is not allowed. Use JPG, JPEG, PNG, or WebP.`,
    };
  }
  if (file.size > MAX_PHOTO_SIZE_BYTES) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `"${file.name}" is ${sizeMB} MB. Maximum allowed size is 5 MB.`,
    };
  }
  return { valid: true, error: null };
}

// ============================================================
// Upload
// ============================================================

/**
 * Generate a UUID-based filename.
 * @param {string} originalName - Original filename from File object
 * @returns {string} e.g. "abc123.jpg"
 */
function generateFileName(originalName) {
  const ext = originalName.split('.').pop().toLowerCase();
  const uuid = crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${uuid}.${ext}`;
}

/**
 * Upload a single photo to Firebase Storage with progress tracking.
 *
 * @param {object} params
 * @param {string} params.garageId
 * @param {string} params.serviceId
 * @param {File}   params.file
 * @param {'before'|'after'} params.type
 * @param {function(number):void} [params.onProgress] - Called with 0-100 percent
 * @returns {Promise<{ url: string, path: string, uploadedAt: Date }>}
 */
export function uploadPhoto({ garageId, serviceId, file, type, onProgress }) {
  return new Promise((resolve, reject) => {
    const fileName = generateFileName(file.name);
    const storagePath = `garages/${garageId}/services/${serviceId}/${type}/${fileName}`;
    const storageRef = ref(storage, storagePath);

    const uploadTask = uploadBytesResumable(storageRef, file, {
      contentType: file.type,
      customMetadata: {
        garageId,
        serviceId,
        photoType: type,
        originalName: file.name,
      },
    });

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const percent = Math.round(
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        );
        if (onProgress) onProgress(percent);
      },
      (error) => {
        console.error('Photo upload error:', error);
        reject(error);
      },
      async () => {
        try {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({
            url,
            path: storagePath,
            uploadedAt: new Date(),
          });
        } catch (err) {
          reject(err);
        }
      }
    );
  });
}

/**
 * Upload multiple photos sequentially with per-file progress.
 *
 * @param {object} params
 * @param {string} params.garageId
 * @param {string} params.serviceId
 * @param {File[]} params.files
 * @param {'before'|'after'} params.type
 * @param {function(number, number):void} [params.onFileProgress]
 *   Called with (fileIndex, percentComplete) for each file
 * @returns {Promise<Array<{ url: string, path: string, uploadedAt: Date }>>}
 */
export async function uploadMultiplePhotos({
  garageId,
  serviceId,
  files,
  type,
  onFileProgress,
}) {
  const results = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const result = await uploadPhoto({
      garageId,
      serviceId,
      file,
      type,
      onProgress: (pct) => {
        if (onFileProgress) onFileProgress(i, pct);
      },
    });
    results.push(result);
  }
  return results;
}

// ============================================================
// Delete
// ============================================================

/**
 * Delete a single photo from Firebase Storage by its path.
 * Silently ignores "object-not-found" errors (already deleted).
 *
 * @param {string} storagePath - e.g. "garages/{id}/services/{id}/before/uuid.jpg"
 */
export async function deletePhoto(storagePath) {
  try {
    const storageRef = ref(storage, storagePath);
    await deleteObject(storageRef);
  } catch (err) {
    // object/not-found means it's already gone — not an error for UX
    if (err.code !== 'storage/object-not-found') {
      console.error('Failed to delete photo from storage:', err);
      throw err;
    }
  }
}

// ============================================================
// Firestore Update Helpers
// ============================================================

/**
 * Persist the full vehicleImages structure to Firestore.
 * Only URLs and metadata are stored — never binary data.
 *
 * @param {string} garageId
 * @param {string} serviceId
 * @param {object} vehicleImages - { beforeRepairPhotos: [], afterRepairPhotos: [], aiProcessingStatus: null }
 */
export async function saveVehicleImages(garageId, serviceId, vehicleImages) {
  const serviceRef = doc(
    db,
    COLLECTIONS.GARAGES,
    garageId,
    COLLECTIONS.SERVICES,
    serviceId
  );
  await updateDoc(serviceRef, {
    vehicleImages,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Append new photos to the before or after array in Firestore.
 * Reads the new photo objects (already uploaded to Storage) and
 * merges them into the existing vehicleImages structure.
 *
 * @param {string} garageId
 * @param {string} serviceId
 * @param {'before'|'after'} type
 * @param {Array<{ url: string, path: string, uploadedAt: Date }>} newPhotos
 * @param {object} existingVehicleImages - Current vehicleImages from Firestore
 */
export async function appendServicePhotos(
  garageId,
  serviceId,
  type,
  newPhotos,
  existingVehicleImages = {}
) {
  const fieldKey =
    type === 'before' ? 'beforeRepairPhotos' : 'afterRepairPhotos';

  const existing = existingVehicleImages?.[fieldKey] || [];
  const toAdd = newPhotos.map((p) => ({
    url: p.url,
    path: p.path,
    uploadedAt: p.uploadedAt instanceof Date ? p.uploadedAt.toISOString() : p.uploadedAt,
  }));

  const merged = [...existing, ...toAdd];

  const updatedVehicleImages = {
    beforeRepairPhotos: existingVehicleImages?.beforeRepairPhotos || [],
    afterRepairPhotos: existingVehicleImages?.afterRepairPhotos || [],
    aiProcessingStatus: existingVehicleImages?.aiProcessingStatus ?? null,
    ...existingVehicleImages,
    [fieldKey]: merged,
  };

  await saveVehicleImages(garageId, serviceId, updatedVehicleImages);
  return updatedVehicleImages;
}

/**
 * Remove a photo from the Firestore photo array and delete from Storage.
 *
 * @param {string} garageId
 * @param {string} serviceId
 * @param {'before'|'after'} type
 * @param {object} photo - { url, path, uploadedAt }
 * @param {object} existingVehicleImages
 */
export async function removeServicePhoto(
  garageId,
  serviceId,
  type,
  photo,
  existingVehicleImages = {}
) {
  const fieldKey =
    type === 'before' ? 'beforeRepairPhotos' : 'afterRepairPhotos';

  const existing = existingVehicleImages?.[fieldKey] || [];
  const filtered = existing.filter((p) => p.url !== photo.url);

  const updatedVehicleImages = {
    ...existingVehicleImages,
    [fieldKey]: filtered,
  };

  // Update Firestore first (so even if storage delete fails, record is gone)
  await saveVehicleImages(garageId, serviceId, updatedVehicleImages);

  // Then delete from Storage (if we have the path)
  if (photo.path) {
    await deletePhoto(photo.path);
  }

  return updatedVehicleImages;
}

/**
 * Build the default vehicleImages structure for new service documents.
 * Prepared for future AI integration (aiProcessingStatus field).
 *
 * @returns {object}
 */
export function buildDefaultVehicleImages() {
  return {
    beforeRepairPhotos: [],
    afterRepairPhotos: [],
    aiProcessingStatus: null, // Reserved for future: number plate OCR, damage detection
  };
}
