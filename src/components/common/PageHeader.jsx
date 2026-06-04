/**
 * PageHeader — GarageSathi
 *
 * Standardised page title bar used at the top of list pages.
 *
 * Props:
 *   title    {string} — page title
 *   subtitle {string} — optional subtitle (e.g., record count)
 *   children {node}   — optional right-hand action slot (e.g., an Add button)
 */

export default function PageHeader({ title, subtitle, children }) {
  return (
    <div className="flex items-center justify-between mb-4">
      {/* Left: title + subtitle */}
      <div className="min-w-0 flex-1">
        <h1 className="text-xl font-bold text-gray-900 truncate">{title}</h1>
        {subtitle && (
          <p className="text-sm text-gray-500 mt-0.5 truncate">{subtitle}</p>
        )}
      </div>

      {/* Right: action slot */}
      {children && (
        <div className="ml-4 flex-shrink-0 flex items-center gap-2">{children}</div>
      )}
    </div>
  );
}
