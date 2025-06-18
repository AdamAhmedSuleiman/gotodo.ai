// src/components/ui/Textarea.tsx
import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  wrapperClassName?: string;
}

const Textarea: React.FC<TextareaProps> = ({ label, name, error, className = '', wrapperClassName = '', ...props }) => {
  const hasError = !!error;
  const baseInputClasses = `block w-full px-3 py-2 border rounded-md shadow-sm 
                           focus:outline-none focus:ring-2 sm:text-sm
                           dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400`;
  
  const colorClasses = hasError 
    ? 'border-red-500 dark:border-red-400 focus:ring-red-500 focus:border-red-500' 
    : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400';

  return (
    <div className={`mb-4 ${wrapperClassName}`}>
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
        </label>
      )}
      <textarea
        id={name}
        name={name}
        className={`${baseInputClasses} ${colorClasses} ${className}`}
        rows={props.rows || 3} // Default to 3 rows if not specified
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
};

export default Textarea;
