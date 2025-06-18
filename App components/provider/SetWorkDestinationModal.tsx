// src/components/provider/SetWorkDestinationModal.tsx
import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal.js';
import Button from '../ui/Button.js';
import Input from '../ui/Input.js';
import { SetWorkDestinationModalProps, GeoLocation } from '../../types.js';

const SetWorkDestinationModal: React.FC<SetWorkDestinationModalProps> = ({
  isOpen,
  onClose,
  onSetDestination,
  currentDestination,
}) => {
  const [address, setAddress] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && currentDestination?.address) {
      setAddress(currentDestination.address);
    } else if (isOpen) {
      setAddress(''); 
    }
  }, [isOpen, currentDestination]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!address.trim()) {
      setError('Please enter a destination address or area.');
      return;
    }
    onSetDestination(address.trim());
    onClose();
  };

  const handleClearDestination = () => {
    onSetDestination(''); 
    setAddress('');
    onClose();
  };

  const handleClose = () => {
    setError(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Set Your Work Destination"
      size="md"
      footer={
        <div className="flex justify-between items-center w-full">
          {currentDestination?.address && (
            <Button variant="danger" onClick={handleClearDestination} size="md">
              Clear Destination
            </Button>
          )}
          <div className={`flex space-x-3 ${!currentDestination?.address ? 'w-full justify-end' : ''}`}>
            <Button variant="secondary" onClick={handleClose} size="md" className="dark:bg-gray-600 dark:hover:bg-gray-500">
              Cancel
            </Button>
            <Button type="submit" variant="primary" form="set-destination-form" size="md">
              Set Destination
            </Button>
          </div>
        </div>
      }
    >
      <form id="set-destination-form" onSubmit={handleSubmit} className="space-y-4 p-1">
        {error && <p className="text-sm text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900 dark:bg-opacity-30 p-2 rounded-md">{error}</p>}
        <Input
          label="Destination Address or Area"
          name="destinationAddress"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="e.g., Downtown Main Street, Airport Area"
          required
        />
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Setting a destination helps us (mock) show you relevant requests along your route.
        </p>
      </form>
    </Modal>
  );
};

export default SetWorkDestinationModal;