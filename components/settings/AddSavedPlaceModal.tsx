// src/components/settings/AddSavedPlaceModal.tsx
import React, { useState } from 'react';
import Modal from '../ui/Modal.js';
import Button from '../ui/Button.js';
import Input from '../ui/Input.js';
import { AddSavedPlaceModalProps, GeoLocation } from '../../types.js';
import { createGeoLocationFromString } from '../../services/userDataService.js';

const AddSavedPlaceModal: React.FC<AddSavedPlaceModalProps> = ({ isOpen, onClose, onSave }) => {
  const [placeName, setPlaceName] = useState('');
  const [addressString, setAddressString] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!placeName.trim() || !addressString.trim()) {
      setError('Place name and address are required.');
      return;
    }
    // In a real app, you might want to geocode the address here or pass it for geocoding
    const location: GeoLocation = createGeoLocationFromString(addressString);

    onSave({ name: placeName, location });
    setPlaceName('');
    setAddressString('');
    onClose();
  };

  const handleClose = () => {
    setPlaceName('');
    setAddressString('');
    setError(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add New Saved Place"
      size="md"
      footer={
        <div className="flex justify-end space-x-3">
          <Button variant="secondary" onClick={handleClose} className="dark:bg-gray-600 dark:hover:bg-gray-500">Cancel</Button>
          <Button type="submit" variant="primary" form="add-saved-place-form">Save Place</Button>
        </div>
      }
    >
      <form id="add-saved-place-form" onSubmit={handleSubmit} className="space-y-4 p-1">
        {error && <p className="text-sm text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900 dark:bg-opacity-30 p-2 rounded-md">{error}</p>}
        <Input
          label="Place Name"
          name="placeName"
          value={placeName}
          onChange={(e) => setPlaceName(e.target.value)}
          placeholder="e.g., Home, Work, Gym"
          required
        />
        <Input
          label="Address"
          name="addressString"
          value={addressString}
          onChange={(e) => setAddressString(e.target.value)}
          placeholder="Enter the full address"
          required
        />
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Note: Type the full address. Location coordinates will be determined when used (mock).
        </p>
      </form>
    </Modal>
  );
};

export default AddSavedPlaceModal;