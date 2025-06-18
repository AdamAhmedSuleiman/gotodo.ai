// src/components/settings/AddSavedMemberModal.tsx
import React, { useState } from 'react';
import Modal from '../ui/Modal.js';
import Button from '../ui/Button.js';
import Input from '../ui/Input.js';
import Textarea from '../ui/Textarea.js';
import { AddSavedMemberModalProps, RecipientDetails, GeoLocation } from '../../types.js';
import { createGeoLocationFromString } from '../../services/userDataService.js';

const AddSavedMemberModal: React.FC<AddSavedMemberModalProps> = ({ isOpen, onClose, onSave }) => {
  const [name, setName] = useState(''); // This is the "Nickname" for the saved member
  const [recipientName, setRecipientName] = useState(''); // Actual name for RecipientDetails
  const [contact, setContact] = useState('');
  const [addressString, setAddressString] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) { // Nickname is primary key for saved member
      setError('Member nickname is required.');
      return;
    }

    let memberAddress: GeoLocation | undefined = undefined;
    if (addressString.trim()) {
        memberAddress = createGeoLocationFromString(addressString.trim());
    }

    const recipientDetails: RecipientDetails = {
      name: recipientName.trim() || name.trim(), // Use specific recipient name if provided, else fallback to nickname
      contact: contact.trim() || undefined,
      address: memberAddress,
      addressString: addressString.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    onSave({ name: name.trim(), details: recipientDetails });

    // Reset form
    setName('');
    setRecipientName('');
    setContact('');
    setAddressString('');
    setNotes('');
    onClose();
  };

  const handleClose = () => {
    setName('');
    setRecipientName('');
    setContact('');
    setAddressString('');
    setNotes('');
    setError(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add New Saved Member/Recipient"
      size="lg"
      footer={
        <div className="flex justify-end space-x-3">
          <Button variant="secondary" onClick={handleClose} className="dark:bg-gray-600 dark:hover:bg-gray-500">Cancel</Button>
          <Button type="submit" variant="primary" form="add-saved-member-form">Save Member</Button>
        </div>
      }
    >
      <form id="add-saved-member-form" onSubmit={handleSubmit} className="space-y-4 p-1">
        {error && <p className="text-sm text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900 dark:bg-opacity-30 p-2 rounded-md">{error}</p>}
        <Input
          label="Saved Member Nickname"
          name="memberName"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Mom, Office Downtown, Client X"
          required
        />
        <Input
          label="Recipient's Full Name (Optional)"
          name="recipientFullName"
          value={recipientName}
          onChange={(e) => setRecipientName(e.target.value)}
          placeholder="Full name of the person or place"
        />
        <Input
          label="Contact Info (Optional)"
          name="memberContact"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          placeholder="e.g., Phone number or Email"
        />
        <Input
          label="Address (Optional)"
          name="memberAddress"
          value={addressString}
          onChange={(e) => setAddressString(e.target.value)}
          placeholder="Enter full address if applicable"
        />
        <Textarea
          label="Notes (Optional)"
          name="memberNotes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g., Preferred contact times, building access code"
          rows={2}
        />
         <p className="text-xs text-gray-500 dark:text-gray-400">
          This information will be pre-filled when you select this member for a request.
        </p>
      </form>
    </Modal>
  );
};

export default AddSavedMemberModal;