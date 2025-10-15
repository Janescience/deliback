'use client';

import { forwardRef } from 'react';

const Input = forwardRef(({ 
  type = 'text',
  label,
  error,
  className = '',
  containerClassName = '',
  ...props 
}, ref) => {
  const baseStyles = 'w-full px-0 py-2 bg-transparent border-0 border-b border-gray-300 focus:outline-none focus:border-black transition-colors text-black placeholder-gray-400';
  
  return (
    <div className={`${containerClassName}`}>
      {label && (
        <label className="block  font-light mb-1 text-black">
          {label}
        </label>
      )}
      <input
        ref={ref}
        type={type}
        className={`${baseStyles} ${error ? 'border-red-500' : ''} ${className}`}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;