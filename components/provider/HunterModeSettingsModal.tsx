// src/components/provider/HunterModeSettingsModal.tsx
import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal.js';
import Button from '../ui/Button.js';
import Input from '../ui/Input.js';
import { HunterModeSettingsModalProps, HunterModeSettings, ServiceType } from '../../types.js';
import { ICON_PATHS } from '../../constants.js';
import Icon from '../ui/Icon.js';

const allServiceTypes = Object.values(ServiceType).filter(
  st => st !== ServiceType.UNKNOWN && st !== ServiceType.EVENT_PLANNING && st !== ServiceType.LOGISTICS // Exclude some broad/internal types
);


const HunterModeSettingsModal: React.FC<HunterModeSettingsModalProps> = ({
  isOpen,
  onClose,
  currentSettings,
  onSaveSettings,
}) => {
  const [maxDistanceKm, setMaxDistanceKm] = useState<number | string>(currentSettings.maxDistanceKm || 20);
  const [preferredServiceTypes, setPreferredServiceTypes] = useState<ServiceType[]>(currentSettings.preferredServiceTypes || []);
  const [minRequestPrice, setMinRequestPrice] = useState<number | string>(currentSettings.minRequestPrice || '');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setMaxDistanceKm(currentSettings.maxDistanceKm || 20);
      setPreferredServiceTypes(currentSettings.preferredServiceTypes || []);
      setMinRequestPrice(currentSettings.minRequestPrice || '');
      setFormError(null);
    }
  }, [isOpen, currentSettings]);

  const handleServiceTypeToggle = (type: ServiceType) => {
    setPreferredServiceTypes(prev =>
      prev.includes(type) ? prev.filter(st => st !== type) : [...prev, type]
    );
  };

  const handleSave = () => {
    setFormError(null);
    const distance = parseFloat(maxDistanceKm as string);
    if (isNaN(distance) || distance <= 0) {
      setFormError('Please enter a valid positive distance.');
      return;
    }
    const price = minRequestPrice ? parseFloat(minRequestPrice as string) : undefined;
    if (minRequestPrice && (isNaN(price) || price < 0)) {
        setFormError('Minimum price must be a valid non-negative number if set.');
        return;
    }

    onSaveSettings({
      ...currentSettings, // Preserve isEnabled status
      maxDistanceKm: distance,
      preferredServiceTypes,
      minRequestPrice: price,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Hunter Mode Settings"
      size="lg"
      footer={
        <div className="flex justify-end space-x-3">
          <Button variant="secondary" onClick={onClose} className="dark:bg-gray-600 dark:hover:bg-gray-500">Cancel</Button>
          <Button variant="primary" onClick={handleSave}>Save Settings</Button>
        </div>
      }
    >
      <div className="space-y-4 p-1 max-h-[70vh] overflow-y-auto">
        {formError && <p className="text-sm text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 p-2 rounded-md">{formError}</p>}
        
        <Input
          label="Search Radius (km)"
          name="maxDistanceKm"
          type="number"
          value={maxDistanceKm}
          onChange={(e) => setMaxDistanceKm(e.target.value)}
          min="1"
          step="1"
          required
        />
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Preferred Service Types</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 border dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700/50">
            {allServiceTypes.map(type => (
              <label key={type} className="flex items-center space-x-2 cursor-pointer p-1.5 hover:bg-gray-100 dark:hover:bg-gray-600 rounded">
                <input
                  type="checkbox"
                  checked={preferredServiceTypes.includes(type)}
                  onChange={() => handleServiceTypeToggle(type)}
                  className="form-checkbox h-4 w-4 text-blue-600 dark:bg-gray-600 dark:border-gray-500 rounded focus:ring-blue-500"
                />
                <span className="text-xs text-gray-700 dark:text-gray-300">{type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
              </label>
            ))}
          </div>
        </div>

        <Input
          label="Minimum Request Price (Optional, $)"
          name="minRequestPrice"
          type="number"
          value={minRequestPrice}
          onChange={(e) => setMinRequestPrice(e.target.value)}
          min="0"
          step="0.01"
          placeholder="e.g., 10"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400">
            Hunter Mode will actively search for requests matching these criteria when you are "Online".
        </p>
      </div>
    </Modal>
  );
};

export default HunterModeSettingsModal;