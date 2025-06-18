// src/components/ui/StarRating.tsx
import React from 'react';
import Icon from './Icon.js'; 
import { ICON_PATHS } from '../../constants.js';
import { StarRatingProps } from '../../types.js';

const StarRating: React.FC<StarRatingProps> = ({
  rating,
  onRatingChange,
  size = 'md',
  readOnly = false,
  className = '',
}) => {
  const stars = [1, 2, 3, 4, 5];

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  const handleStarClick = (starValue: number) => {
    if (!readOnly && onRatingChange) {
      onRatingChange(starValue);
    }
  };

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      {stars.map((starValue) => (
        <button
          key={starValue}
          type="button"
          onClick={() => handleStarClick(starValue)}
          disabled={readOnly}
          className={`focus:outline-none ${!readOnly ? 'cursor-pointer' : 'cursor-default'}`}
          aria-label={`Rate ${starValue} star${starValue > 1 ? 's' : ''}`}
        >
          <Icon
            path={ICON_PATHS.STAR}
            className={`${sizeClasses[size]} ${
              starValue <= rating ? 'text-yellow-400 dark:text-yellow-300 fill-yellow-400 dark:fill-yellow-300' : 'text-gray-300 dark:text-gray-600'
            }`}
          />
        </button>
      ))}
    </div>
  );
};

export default StarRating;