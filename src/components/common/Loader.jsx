/**
 * Loader — GarageSathi
 *
 * Reusable loading spinner.
 * Supports full-page overlay and inline use.
 *
 * Props:
 *   fullPage {boolean} — overlay the whole screen
 *   text     {string}  — optional label below the spinner
 *   size     {string}  — 'sm' | 'md' | 'lg'
 */

export default function Loader({ fullPage = false, text = '', size = 'md' }) {
  const sizes = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-4',
  };

  const spinner = (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        className={`${sizes[size]} border-primary-200 border-t-primary-500 rounded-full animate-spin`}
      />
      {text && (
        <p className="text-sm text-gray-500 font-medium">{text}</p>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
        {spinner}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-12">
      {spinner}
    </div>
  );
}
