// src/components/ui/Icon.tsx
import React from 'react';
import { ICON_PATHS } from '../../constants.js';

interface IconProps {
  path: string;
  className?: string;
  viewBox?: string;
}

const Icon: React.FC<IconProps> = ({ path, className = "w-6 h-6", viewBox = "0 0 24 24" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox={viewBox}
    strokeWidth={1.5}
    stroke="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d={path} />
  </svg>
);

export default Icon;