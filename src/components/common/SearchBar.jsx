/**
 * SearchBar — GarageSathi
 *
 * Mobile-friendly search input with clear button.
 *
 * Props:
 *   value       {string}   — controlled value
 *   onChange    {function} — (newValue: string) => void
 *   placeholder {string}
 *   disabled    {boolean}
 */

import { Search, X } from 'lucide-react';

export default function SearchBar({
  value = '',
  onChange,
  placeholder = 'Search...',
  disabled = false,
}) {
  return (
    <div className="relative">
      {/* Search icon */}
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />

      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="input-field pl-10 pr-10"
      />

      {/* Clear button — only shown when there is a value */}
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 hover:text-gray-600 focus:outline-none"
          aria-label="Clear search"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
