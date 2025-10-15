'use client';

import { forwardRef } from 'react';

const Select = forwardRef(({ 
  label,
  error,
  children,
  className = '',
  containerClassName = '',
  ...props 
}, ref) => {
  const baseStyles = 'w-full px-0 py-2 bg-transparent border-0 border-b border-gray-300 focus:outline-none focus:border-black transition-colors text-black appearance-none cursor-pointer';
  
  return (
    <div className={`relative ${containerClassName}`}>
      {label && (
        <label className="block  font-light mb-1 text-black">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          className={`${baseStyles} ${error ? 'border-red-500' : ''} ${className}`}
          {...props}
        >
          {children}
        </select>
        {/* Custom dropdown arrow */}
        <div className="absolute right-0 top-1/2 transform -translate-y-1/2 pointer-events-none">
          <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
});

Select.displayName = 'Select';

export default Select;