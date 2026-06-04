/**
 * Badge — GarageSathi
 *
 * Pill-shaped status badge.
 * Maps to the CSS badge classes defined in index.css.
 *
 * Props:
 *   variant  {string} — 'success' | 'warning' | 'error' | 'info' | 'neutral'
 *   children {node}
 */

const VARIANT_CLASSES = {
  success: 'badge-success',
  warning: 'badge-warning',
  error:   'badge-error',
  info:    'badge-info',
  neutral: 'badge-neutral',
};

export default function Badge({ variant = 'neutral', children }) {
  const cls = VARIANT_CLASSES[variant] ?? VARIANT_CLASSES.neutral;
  return <span className={cls}>{children}</span>;
}
