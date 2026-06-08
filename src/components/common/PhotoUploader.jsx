/**
 * PhotoUploader — GarageSathi Phase 3
 *
 * Reusable vehicle photo upload component with:
 * - Instant local preview via URL.createObjectURL
 * - Per-file upload progress indicator
 * - Remove button for each photo (staged + uploaded)
 * - File type and size validation
 * - Mobile-friendly grid layout
 *
 * Props:
 *   photos       {Array}    - Currently uploaded/staged photo objects
 *   onPhotosChange {fn}     - (updatedPhotos: Array) => void
 *   garageId     {string}   - For Firebase Storage path construction
 *   serviceId    {string|null} - null in create mode (staged until submit)
 *   type         {'before'|'after'}
 *   maxPhotos    {number}   - Default 10
 *   disabled     {boolean}
 *   uploadImmediately {boolean} - true = upload on select, false = stage for later
 */

import { useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Camera, X, Upload, ImageIcon, CheckCircle } from 'lucide-react';
import {
  validatePhotoFile,
  uploadPhoto,
  MAX_PHOTOS_PER_TYPE,
  ALLOWED_PHOTO_TYPES,
} from '@/services/photoService';

export default function PhotoUploader({
  photos = [],
  onPhotosChange,
  garageId,
  serviceId,
  type = 'before',
  maxPhotos = MAX_PHOTOS_PER_TYPE,
  disabled = false,
  uploadImmediately = false,
}) {
  const fileInputRef = useRef(null);

  // Track per-file upload progress: { [localId]: 0-100 }
  const [uploadProgress, setUploadProgress] = useState({});
  // Track which local IDs are currently uploading
  const [uploading, setUploading] = useState({});

  const remaining = maxPhotos - photos.length;
  const canUploadMore = remaining > 0 && !disabled;

  /**
   * Immediately upload files and call onPhotosChange with real URLs.
   */
  const processImmediateUpload = async (files) => {
    // Add placeholder entries immediately for visual feedback
    const placeholders = files.map((file) => ({
      _localId: `uploading-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      _file: file,
      _isUploading: true,
      url: URL.createObjectURL(file),
      path: null,
      uploadedAt: null,
    }));

    const withPlaceholders = [...photos, ...placeholders];
    onPhotosChange(withPlaceholders);

    // Start tracking progress
    const progressMap = {};
    const uploadingMap = {};
    placeholders.forEach((p) => {
      progressMap[p._localId] = 0;
      uploadingMap[p._localId] = true;
    });
    setUploadProgress((prev) => ({ ...prev, ...progressMap }));
    setUploading((prev) => ({ ...prev, ...uploadingMap }));

    // Upload each file
    const settled = await Promise.allSettled(
      placeholders.map((placeholder) =>
        uploadPhoto({
          garageId,
          serviceId,
          file: placeholder._file,
          type,
          onProgress: (pct) => {
            setUploadProgress((prev) => ({
              ...prev,
              [placeholder._localId]: pct,
            }));
          },
        }).then((result) => ({ placeholder, result }))
      )
    );

    // Build final photo list by replacing placeholders with real data
    let currentPhotos = withPlaceholders;
    for (const outcome of settled) {
      if (outcome.status === 'fulfilled') {
        const { placeholder, result } = outcome.value;
        currentPhotos = currentPhotos.map((p) =>
          p._localId === placeholder._localId
            ? {
                url: result.url,
                path: result.path,
                uploadedAt: result.uploadedAt,
              }
            : p
        );
        setUploading((prev) => {
          const next = { ...prev };
          delete next[placeholder._localId];
          return next;
        });
        setUploadProgress((prev) => {
          const next = { ...prev };
          delete next[placeholder._localId];
          return next;
        });
      } else {
        // Failed upload — remove placeholder
        const placeholder = placeholders.find(
          (p) => p._localId === outcome.reason?._localId
        );
        toast.error(`Failed to upload a photo. Please try again.`);
        if (placeholder) {
          currentPhotos = currentPhotos.filter(
            (p) => p._localId !== placeholder._localId
          );
          setUploading((prev) => {
            const next = { ...prev };
            delete next[placeholder._localId];
            return next;
          });
        }
      }
    }

    onPhotosChange(currentPhotos);
  };

  /**
   * Handle files selected via file input.
   * Validates each file, then either stages or immediately uploads.
   */
  const handleFilesSelected = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    // Reset input so the same file can be re-selected if removed
    e.target.value = '';

    // Check how many more we can add
    const allowedCount = maxPhotos - photos.length;
    if (allowedCount <= 0) {
      toast.error(`Maximum ${maxPhotos} photos allowed.`);
      return;
    }

    const filesToProcess = files.slice(0, allowedCount);
    if (files.length > allowedCount) {
      toast.error(
        `Only ${allowedCount} more photo(s) can be added. ${files.length - allowedCount} file(s) skipped.`
      );
    }

    // Validate each file
    const validFiles = [];
    for (const file of filesToProcess) {
      const { valid, error } = validatePhotoFile(file);
      if (!valid) {
        toast.error(error);
      } else {
        validFiles.push(file);
      }
    }

    if (!validFiles.length) return;

    if (uploadImmediately && garageId && serviceId) {
      // Upload mode: upload right away and store URLs
      await processImmediateUpload(validFiles);
    } else {
      // Staged mode: create local preview objects for batch upload on form submit
      const staged = validFiles.map((file) => ({
        _localId: `staged-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        _file: file,
        _isStaged: true,
        url: URL.createObjectURL(file),
        path: null,
        uploadedAt: null,
      }));
      onPhotosChange([...photos, ...staged]);
    }
  };

  /**
   * Remove a photo from the list.
   * For staged photos: revoke the local object URL and remove from array.
   * For uploaded photos: caller is responsible for Storage deletion.
   */
  const handleRemove = (photo) => {
    if (photo._isStaged && photo.url?.startsWith('blob:')) {
      URL.revokeObjectURL(photo.url);
    }
    onPhotosChange(photos.filter((p) => p !== photo));
  };

  const isPhotoUploading = (photo) =>
    photo._localId && uploading[photo._localId];

  const getPhotoProgress = (photo) =>
    photo._localId ? uploadProgress[photo._localId] ?? 0 : 100;

  return (
    <div className="space-y-3">
      {/* Grid of photo previews */}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {photos.map((photo, idx) => {
            const uploading_ = isPhotoUploading(photo);
            const progress = getPhotoProgress(photo);

            return (
              <div
                key={photo.url || photo._localId || idx}
                className="relative aspect-square rounded-xl overflow-hidden border-2 border-surface-200 bg-surface-50 group"
              >
                {/* Thumbnail */}
                <img
                  src={photo.url}
                  alt={`Vehicle photo ${idx + 1}`}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />

                {/* Upload progress overlay */}
                {uploading_ && (
                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
                    {/* Circular-style progress */}
                    <div className="relative w-10 h-10">
                      <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                        <circle
                          cx="18" cy="18" r="15.9"
                          fill="none"
                          stroke="rgba(255,255,255,0.2)"
                          strokeWidth="3"
                        />
                        <circle
                          cx="18" cy="18" r="15.9"
                          fill="none"
                          stroke="#ffffff"
                          strokeWidth="3"
                          strokeDasharray={`${progress} 100`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-white text-[9px] font-bold">
                        {progress}%
                      </span>
                    </div>
                  </div>
                )}

                {/* Uploaded check */}
                {!uploading_ && !photo._isStaged && (
                  <div className="absolute top-1 left-1">
                    <CheckCircle className="w-4 h-4 text-green-400 drop-shadow" />
                  </div>
                )}

                {/* Staged badge */}
                {photo._isStaged && !uploading_ && (
                  <div className="absolute bottom-0 inset-x-0 bg-amber-500/80 text-white text-[9px] font-bold text-center py-0.5">
                    STAGED
                  </div>
                )}

                {/* Remove button — visible on hover, not shown during upload */}
                {!uploading_ && !disabled && (
                  <button
                    type="button"
                    onClick={() => handleRemove(photo)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-red-700 focus:opacity-100"
                    aria-label="Remove photo"
                    title="Remove photo"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}

          {/* Add more slot */}
          {canUploadMore && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square rounded-xl border-2 border-dashed border-surface-300 flex flex-col items-center justify-center text-gray-400 hover:border-primary-400 hover:text-primary-500 hover:bg-primary-50 transition-colors"
              aria-label="Add more photos"
            >
              <Camera className="w-5 h-5" />
              <span className="text-[10px] font-medium mt-1">Add</span>
            </button>
          )}
        </div>
      )}

      {/* Empty state — upload trigger */}
      {photos.length === 0 && (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className="w-full border-2 border-dashed border-surface-300 rounded-xl py-6 flex flex-col items-center gap-2 text-gray-400 hover:border-primary-400 hover:text-primary-500 hover:bg-primary-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Upload vehicle photos"
        >
          <div className="w-12 h-12 rounded-full bg-surface-100 flex items-center justify-center">
            <Upload className="w-6 h-6" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-600">Click to upload photos</p>
            <p className="text-xs text-gray-400 mt-0.5">JPG, PNG, WebP · Max 5 MB each</p>
          </div>
        </button>
      )}

      {/* Upload button (when photos exist) */}
      {photos.length > 0 && !canUploadMore && (
        <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium px-1">
          <ImageIcon className="w-3.5 h-3.5" />
          <span>Maximum {maxPhotos} photos reached</span>
        </div>
      )}

      {/* Photo count + upload trigger row */}
      {photos.length > 0 && canUploadMore && (
        <div className="flex items-center justify-between px-1">
          <span className="text-xs text-gray-400 font-medium">
            {photos.length} of {maxPhotos} photos
          </span>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="text-xs text-primary-600 font-semibold hover:text-primary-700 flex items-center gap-1 disabled:opacity-50"
          >
            <Upload className="w-3.5 h-3.5" />
            Add More
          </button>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_PHOTO_TYPES.join(',')}
        multiple
        className="hidden"
        onChange={handleFilesSelected}
        disabled={disabled}
        aria-hidden="true"
      />
    </div>
  );
}
