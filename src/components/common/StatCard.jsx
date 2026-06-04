/**
 * StatCard — GarageSathi
 *
 * Dashboard stat card showing a metric with icon and optional click.
 *
 * Props:
 *   title   {string}    — label (e.g. "Customers")
 *   value   {string|number} — the metric to display
 *   icon    {component} — Lucide icon component
 *   color   {string}    — 'primary' | 'success' | 'warning' | 'info' | 'error'
 *   onClick {function}  — optional tap handler
 */

const COLOR_MAP = {
  primary: {
    bg:   'bg-primary-50',
    icon: 'bg-primary-100 text-primary-600',
    text: 'text-primary-700',
  },
  success: {
    bg:   'bg-green-50',
    icon: 'bg-green-100 text-green-600',
    text: 'text-green-700',
  },
  warning: {
    bg:   'bg-amber-50',
    icon: 'bg-amber-100 text-amber-600',
    text: 'text-amber-700',
  },
  info: {
    bg:   'bg-blue-50',
    icon: 'bg-blue-100 text-blue-600',
    text: 'text-blue-700',
  },
  error: {
    bg:   'bg-red-50',
    icon: 'bg-red-100 text-red-600',
    text: 'text-red-700',
  },
};

export default function StatCard({ title, value, icon: Icon, color = 'primary', onClick }) {
  const theme = COLOR_MAP[color] ?? COLOR_MAP.primary;

  return (
    <div
      className={`card ${theme.bg} cursor-pointer active:opacity-80 transition-opacity`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      {/* Icon */}
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${theme.icon}`}>
        {Icon && <Icon className="w-5 h-5" />}
      </div>

      {/* Value */}
      <p className={`text-2xl font-bold ${theme.text}`}>{value}</p>

      {/* Label */}
      <p className="text-sm text-gray-500 mt-0.5 font-medium">{title}</p>
    </div>
  );
}
