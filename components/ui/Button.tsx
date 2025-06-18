// src/components/ui/Button.tsx
import React from 'react';
import Icon from './Icon.js'; 
import { ICON_PATHS } from '../../constants.js'; 

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline'; 
  size?: 'xs' | 'sm' | 'md' | 'lg'; 
  leftIcon?: React.ReactNode | keyof typeof ICON_PATHS; 
  rightIcon?: React.ReactNode | keyof typeof ICON_PATHS; 
  isLoading?: boolean;
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  leftIcon,
  rightIcon,
  isLoading = false,
  fullWidth = false,
  className = '',
  ...props
}) => {
  const baseStyles = "font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-colors duration-150 ease-in-out inline-flex items-center justify-center";

  const variantStyles = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-blue-400",
    secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-400 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600 dark:focus:ring-gray-500",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 dark:bg-red-500 dark:hover:bg-red-600 dark:focus:ring-red-400",
    ghost: "bg-transparent text-blue-600 hover:bg-blue-50 focus:ring-blue-500 dark:text-blue-400 dark:hover:bg-blue-700/20 dark:focus:ring-blue-400",
    outline: "bg-transparent text-blue-600 border border-blue-500 hover:bg-blue-50 focus:ring-blue-500 dark:text-blue-400 dark:border-blue-400 dark:hover:bg-blue-700/20 dark:focus:ring-blue-400",
  };

  const sizeStyles = {
    xs: "px-2.5 py-1.5 text-xs",
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };

  const widthStyles = fullWidth ? "w-full" : "";
  const disabledStyles = "disabled:opacity-60 disabled:cursor-not-allowed";

  const renderIcon = (iconProp: React.ReactNode | keyof typeof ICON_PATHS) => {
    if (typeof iconProp === 'string' && ICON_PATHS[iconProp as keyof typeof ICON_PATHS]) {
      return <Icon path={ICON_PATHS[iconProp as keyof typeof ICON_PATHS]} className={`w-${size === 'sm' || size === 'xs' ? 4 : 5} h-${size === 'sm' || size === 'xs' ? 4 : 5}`} />;
    }
    if (typeof iconProp === 'symbol') return null; // Guard against symbols
    return iconProp;
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyles} ${disabledStyles} ${className}`}
      disabled={isLoading || props.disabled}
      aria-busy={isLoading}
      aria-live="polite"
      {...props}
    >
      {isLoading && (
        <svg className={`animate-spin -ml-1 mr-3 h-5 w-5 ${variant === 'primary' || variant === 'danger' ? 'text-white' : 'text-current'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {leftIcon && !isLoading && <span className="mr-2 inline-flex items-center">{renderIcon(leftIcon)}</span>}
      {children as React.ReactNode}
      {rightIcon && !isLoading && <span className="ml-2 inline-flex items-center">{renderIcon(rightIcon)}</span>}
    </button>
  );
};

export default Button;