/**
 * EmptyState — GarageSathi
 *
 * Placeholder shown when a list has no items.
 *
 * Props:
 *   icon        {component} — Lucide icon component
 *   title       {string}    — main heading
 *   description {string}    — sub-text
 *   actionLabel {string}    — optional CTA button text
 *   onAction    {function}  — optional CTA button handler
 */

export default function EmptyState({ icon: Icon, title, description, actionLabel, onAction }) {
  return (
    <div className="card flex flex-col items-center justify-center text-center py-12 px-6">
      {Icon && (
        <div className="w-16 h-16 bg-surface-100 rounded-full flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 text-surface-400" />
        </div>
      )}

      {title && (
        <h3 className="text-lg font-semibold text-gray-800 mb-1">{title}</h3>
      )}

      {description && (
        <p className="text-sm text-gray-500 mb-6 max-w-xs">{description}</p>
      )}

      {actionLabel && onAction && (
        <button onClick={onAction} className="btn-primary">
          {actionLabel}
        </button>
      )}
    </div>
  );
}
