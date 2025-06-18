// src/components/ui/Input.tsx
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  wrapperClassName?: string;
  leftIcon?: React.ReactNode; // For icons inside the input field
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, name, error, className = '', wrapperClassName = '', leftIcon, ...props }, ref) => {
    const hasError = !!error;
    const baseInputClasses = `block w-full py-2 border rounded-md shadow-sm 
                             focus:outline-none focus:ring-2 sm:text-sm
                             dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400`;
    
    const colorClasses = hasError 
      ? 'border-red-500 dark:border-red-400 focus:ring-red-500 focus:border-red-500' 
      : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400';

    const paddingClasses = leftIcon ? 'pl-10 pr-3' : 'px-3';

    return (
      <div className={`mb-4 ${wrapperClassName}`}>
        {label && (
          <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {label}
          </label>
        )}
        <div className="relative rounded-md shadow-sm">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 dark:text-gray-400 sm:text-sm">
                {leftIcon}
              </span>
            </div>
          )}
          <input
            ref={ref}
            id={name}
            name={name}
            className={`${baseInputClasses} ${colorClasses} ${paddingClasses} ${className}`}
            {...props}
          />
        </div>
        {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input'; // Optional: for better debugging in React DevTools

export default Input;
