/**
 * PhotoGallery — GarageSathi Phase 3
 *
 * Professional photo gallery with:
 * - Tabbed view: Before Repair / After Repair
 * - Responsive 3-4 column grid with lazy-loaded thumbnails
 * - Lightbox modal: full-screen view, prev/next, ESC to close, backdrop click
 * - Download button in lightbox
 * - Photo count badges on tab headers
 * - Empty state per tab
 *
 * Props:
 *   beforePhotos {Array}  - [{ url, path, uploadedAt }]
 *   afterPhotos  {Array}  - [{ url, path, uploadedAt }]
 *   className    {string} - Optional wrapper class
 */

import { useState, useEffect } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  ZoomIn,
  Image as ImageIcon,
} from 'lucide-react';

export default function PhotoGallery({
  beforePhotos = [],
  afterPhotos = [],
  className = '',
}) {
  const [activeTab, setActiveTab] = useState('before');
  const [lightboxIndex, setLightboxIndex] = useState(null); // null = closed

  const currentPhotos = activeTab === 'before' ? beforePhotos : afterPhotos;
  const isLightboxOpen = lightboxIndex !== null;

  const openLightbox = (idx) => setLightboxIndex(idx);
  const closeLightbox = () => setLightboxIndex(null);

  const navigateLightbox = (direction) => {
    if (lightboxIndex === null) return;
    const total = currentPhotos.length;
    setLightboxIndex((prev) => (prev + direction + total) % total);
  };

  // Close lightbox on ESC / Arrow keys
  useEffect(() => {
    if (!isLightboxOpen) return;

    const handleKey = (e) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') navigateLightbox(-1);
      if (e.key === 'ArrowRight') navigateLightbox(1);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLightboxOpen, lightboxIndex, currentPhotos.length]);

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    document.body.style.overflow = isLightboxOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isLightboxOpen]);

  // Format uploadedAt for display
  const formatUploadDate = (uploadedAt) => {
    if (!uploadedAt) return null;
    try {
      const d = uploadedAt instanceof Date ? uploadedAt : new Date(uploadedAt);
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return null;
    }
  };

  const activePhoto = isLightboxOpen ? currentPhotos[lightboxIndex] : null;

  // If both empty, show nothing
  if (beforePhotos.length === 0 && afterPhotos.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      {/* Tab Headers */}
      <div className="flex gap-1 mb-4 bg-surface-100 rounded-xl p-1">
        <TabButton
          active={activeTab === 'before'}
          onClick={() => setActiveTab('before')}
          count={beforePhotos.length}
          label="Before Repair"
          color="amber"
        />
        <TabButton
          active={activeTab === 'after'}
          onClick={() => setActiveTab('after')}
          count={afterPhotos.length}
          label="After Repair"
          color="green"
        />
      </div>

      {/* Photo Grid */}
      {currentPhotos.length === 0 ? (
        <EmptyGallery type={activeTab} />
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {currentPhotos.map((photo, idx) => (
            <button
              key={photo.url || idx}
              type="button"
              onClick={() => openLightbox(idx)}
              className="relative aspect-square rounded-xl overflow-hidden border border-surface-200 bg-surface-50 group hover:border-primary-400 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1"
              aria-label={`View photo ${idx + 1} of ${currentPhotos.length}`}
            >
              <img
                src={photo.url}
                alt={`Vehicle ${activeTab} repair photo ${idx + 1}`}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              />
              {/* Zoom overlay on hover */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
              </div>
              {/* Photo number badge */}
              <div className="absolute bottom-1 right-1 bg-black/50 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                {idx + 1}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Photo count footer */}
      {currentPhotos.length > 0 && (
        <p className="text-xs text-gray-400 font-medium mt-2 text-center">
          {currentPhotos.length} photo{currentPhotos.length !== 1 ? 's' : ''} ·{' '}
          {activeTab === 'before' ? 'Before Repair' : 'After Repair'}
        </p>
      )}

      {/* ================================================================
           Lightbox Modal
           ================================================================ */}
      {isLightboxOpen && activePhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex flex-col"
          role="dialog"
          aria-modal="true"
          aria-label="Photo lightbox"
        >
          {/* Top bar */}
          <div className="flex items-center justify-between px-4 py-3 flex-shrink-0">
            <div className="text-white">
              <p className="text-sm font-semibold">
                {activeTab === 'before' ? 'Before Repair' : 'After Repair'} — Photo{' '}
                {lightboxIndex + 1} of {currentPhotos.length}
              </p>
              {formatUploadDate(activePhoto.uploadedAt) && (
                <p className="text-xs text-white/50 mt-0.5">
                  Uploaded: {formatUploadDate(activePhoto.uploadedAt)}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* Download button */}
              <a
                href={activePhoto.url}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                title="Download photo"
                aria-label="Download photo"
              >
                <Download className="w-4 h-4 text-white" />
              </a>
              {/* Close button */}
              <button
                type="button"
                onClick={closeLightbox}
                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                aria-label="Close lightbox"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Image area — click backdrop to close */}
          <div
            className="flex-1 flex items-center justify-center px-16 py-4 overflow-hidden relative"
            onClick={closeLightbox}
          >
            <img
              src={activePhoto.url}
              alt={`Vehicle photo ${lightboxIndex + 1}`}
              className="max-w-full max-h-full object-contain rounded-lg select-none"
              onClick={(e) => e.stopPropagation()}
              draggable="false"
            />
          </div>

          {/* Navigation arrows */}
          {currentPhotos.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => navigateLightbox(-1)}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center transition-colors"
                aria-label="Previous photo"
              >
                <ChevronLeft className="w-6 h-6 text-white" />
              </button>
              <button
                type="button"
                onClick={() => navigateLightbox(1)}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center transition-colors"
                aria-label="Next photo"
              >
                <ChevronRight className="w-6 h-6 text-white" />
              </button>
            </>
          )}

          {/* Dot indicators */}
          {currentPhotos.length > 1 && currentPhotos.length <= 15 && (
            <div className="flex items-center justify-center gap-1.5 py-3 flex-shrink-0">
              {currentPhotos.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setLightboxIndex(idx)}
                  className={`rounded-full transition-all ${
                    idx === lightboxIndex
                      ? 'w-5 h-2 bg-white'
                      : 'w-2 h-2 bg-white/40 hover:bg-white/60'
                  }`}
                  aria-label={`Go to photo ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Sub-components
// ============================================================

function TabButton({ active, onClick, count, label, color }) {
  const colorClasses = {
    amber: active
      ? 'bg-amber-500 text-white shadow-sm'
      : 'text-gray-500 hover:text-gray-700',
    green: active
      ? 'bg-green-500 text-white shadow-sm'
      : 'text-gray-500 hover:text-gray-700',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-semibold transition-colors ${colorClasses[color]}`}
      aria-selected={active}
      role="tab"
    >
      <span>{label}</span>
      {count > 0 && (
        <span
          className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[11px] font-bold ${
            active ? 'bg-white/20 text-white' : 'bg-surface-200 text-gray-600'
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function EmptyGallery({ type }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-gray-400">
      <div className="w-12 h-12 rounded-full bg-surface-100 flex items-center justify-center mb-3">
        <ImageIcon className="w-6 h-6" />
      </div>
      <p className="text-sm font-medium text-gray-500">No photos yet</p>
      <p className="text-xs text-gray-400 mt-1">
        {type === 'before'
          ? 'Before repair photos will appear here'
          : 'After repair photos will appear here'}
      </p>
    </div>
  );
}
