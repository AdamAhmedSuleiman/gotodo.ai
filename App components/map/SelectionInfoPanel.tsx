
// src/components/map/SelectionInfoPanel.tsx
import React from 'react';
import { MapMarkerData, MockProviderProfile, Product, SelectionInfoPanelProps } from '../../src/types.js';
import Button from '../ui/Button.js';
import Icon from '../ui/Icon.js';
import { ICON_PATHS } from '../../src/constants.js';
import StarRating from '../ui/StarRating.js';

const SelectionInfoPanel: React.FC<SelectionInfoPanelProps> = ({
  item,
  isOpen,
  onClose,
  onContactProvider,
  onViewProduct,
}) => {
  if (!isOpen || !item) {
    return null;
  }

  const isProvider = item.type === 'provider' && item.data && 'serviceTypes' in item.data;
  const isProduct = item.type === 'product' && item.data && 'price' in item.data;
  
  const provider = isProvider ? item.data as MockProviderProfile : null;
  const product = isProduct ? item.data as Product : null;

  return (
    <div 
      className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 md:top-4 md:right-4 md:left-auto md:bottom-auto md:-translate-x-0 md:-translate-y-0
                  bg-white dark:bg-gray-800 shadow-xl rounded-lg p-4 w-full max-w-sm md:max-w-xs
                  border border-gray-200 dark:border-gray-700 z-[1000] transform transition-all duration-300 ease-in-out
                  ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}
      role="dialog"
      aria-labelledby="selection-info-title"
      aria-modal="true"
    >
      <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
        <h3 id="selection-info-title" className="text-lg font-semibold text-gray-800 dark:text-gray-100 truncate">
          {item.title || (provider?.name) || (product?.name) || 'Details'}
        </h3>
        <Button variant="ghost" size="sm" onClick={onClose} className="p-1 -mr-1" aria-label="Close panel">
          <Icon path={ICON_PATHS.X_MARK_ICON} className="w-5 h-5" />
        </Button>
      </div>

      <div className="max-h-[60vh] md:max-h-[70vh] overflow-y-auto pr-1 space-y-3 text-sm">
        {provider && (
          <>
            <div className="flex items-center space-x-3 mb-2">
              <img 
                src={provider.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(provider.name)}&background=random`}
                alt={`${provider.name}'s avatar`}
                className="w-16 h-16 rounded-full object-cover border-2 border-gray-300 dark:border-gray-600"
              />
              <div>
                <h4 className="font-medium text-gray-800 dark:text-gray-200">{provider.name}</h4>
                {provider.averageRating > 0 && <StarRating rating={provider.averageRating} readOnly size="sm" />}
                <p className="text-xs text-gray-500 dark:text-gray-400">{provider.location.address}</p>
              </div>
            </div>
            {provider.bio && <p className="text-gray-600 dark:text-gray-300 text-xs italic">"{provider.bio}"</p>}
            {provider.specialties && provider.specialties.length > 0 && (
              <div>
                <strong className="text-gray-700 dark:text-gray-200">Specialties:</strong>
                <ul className="list-disc list-inside ml-1 text-gray-600 dark:text-gray-300 text-xs">
                  {provider.specialties.slice(0,3).map(s => <li key={s}>{s}</li>)}
                </ul>
              </div>
            )}
            {provider.operationalHours && <p className="text-xs text-gray-500 dark:text-gray-400">Hours: {provider.operationalHours}</p>}
            {provider.servicesOffered && provider.servicesOffered.length > 0 && (
              <div>
                <strong className="text-gray-700 dark:text-gray-200">Services:</strong>
                <ul className="list-disc list-inside ml-1 text-gray-600 dark:text-gray-300 text-xs">
                  {provider.servicesOffered.slice(0,2).map(s => <li key={s.name}>{s.name} (${s.rate} {s.rateType})</li>)}
                </ul>
              </div>
            )}
            {onContactProvider && (
              <Button 
                onClick={() => onContactProvider(provider.id)} 
                variant="primary" 
                size="sm" 
                className="w-full mt-3"
              >
                Contact Provider (Mock)
              </Button>
            )}
          </>
        )}

        {product && (
          <>
            <h4 className="font-medium text-gray-800 dark:text-gray-200">{product.name}</h4>
            <p className="text-xl font-bold text-green-600 dark:text-green-400">${product.price.toFixed(2)}</p>
            <p className="text-gray-600 dark:text-gray-300 text-xs">{product.description}</p>
            {product.category && <p className="text-xs text-gray-500 dark:text-gray-400">Category: {product.category}</p>}
            {product.stock > 0 && <p className="text-xs text-green-600 dark:text-green-400">In Stock: {product.stock}</p>}
            {onViewProduct && provider && ( // Assuming product is always linked to a provider for this button
              <Button 
                onClick={() => onViewProduct(product.id, provider.id)} 
                variant="primary" 
                size="sm" 
                className="w-full mt-3"
              >
                View Product (Mock)
              </Button>
            )}
          </>
        )}

        {!provider && !product && item.data && (
            <pre className="text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded overflow-x-auto">
                {JSON.stringify(item.data, null, 2)}
            </pre>
        )}
         {!provider && !product && !item.data && (
            <p className="text-xs text-gray-500 dark:text-gray-400">No additional details for this item.</p>
        )}
      </div>
    </div>
  );
};

export default SelectionInfoPanel;