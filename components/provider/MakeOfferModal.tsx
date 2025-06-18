// src/components/provider/MakeOfferModal.tsx
import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal.js';
import Button from '../ui/Button.js';
import Input from '../ui/Input.js';
import Textarea from '../ui/Textarea.js';
import { MakeOfferModalProps, RequestData } from '../../types.js';
import Icon from '../ui/Icon.js';
import { ICON_PATHS } from '../../constants.js';

const MakeOfferModal: React.FC<MakeOfferModalProps> = ({
  isOpen,
  onClose,
  request,
  onSubmitOffer,
}) => {
  const [offerAmount, setOfferAmount] = useState<number | string>('');
  const [message, setMessage] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Pre-fill offer amount with request's suggested price if available, as a starting point
      setOfferAmount(request.suggestedPrice || '');
      setMessage('');
      setFormError(null);
    }
  }, [isOpen, request.suggestedPrice]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const amount = parseFloat(offerAmount as string);

    if (isNaN(amount) || amount <= 0) {
      setFormError('Please enter a valid positive offer amount.');
      return;
    }
    onSubmitOffer(amount, message.trim());
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Make an Offer for: "${request.textInput || request.aiAnalysisSummary?.substring(0, 30) || request.id.substring(0,8)}..."`}
      size="lg"
      footer={
        <div className="flex justify-end space-x-3">
          <Button variant="secondary" onClick={onClose} className="dark:bg-gray-600 dark:hover:bg-gray-500">
            Cancel
          </Button>
          <Button type="submit" variant="primary" form="make-offer-form">
            Submit Offer
          </Button>
        </div>
      }
    >
      <form id="make-offer-form" onSubmit={handleSubmit} className="space-y-4 p-1">
        {formError && <p className="text-sm text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 p-2 rounded-md">{formError}</p>}
        
        <div className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded-md text-xs">
          <p><strong>Request Summary:</strong> {request.aiAnalysisSummary || request.textInput}</p>
          <p><strong>Service Type:</strong> {request.type}</p>
          {request.suggestedPrice && <p><strong>Original Suggested Price:</strong> ${request.suggestedPrice.toFixed(2)}</p>}
        </div>

        <Input
          label="Your Offer Amount ($)"
          name="offerAmount"
          type="number"
          value={offerAmount}
          onChange={(e) => setOfferAmount(e.target.value)}
          placeholder="e.g., 25.00"
          min="0.01"
          step="0.01"
          required
          leftIcon={<Icon path={ICON_PATHS.BANKNOTES} className="w-4 h-4 text-gray-400" />}
        />
        <Textarea
          label="Message to Requester (Optional)"
          name="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="e.g., I can start immediately and offer a discount for quick booking."
          rows={3}
        />
         <p className="text-xs text-gray-500 dark:text-gray-400">
            Your offer will be sent to the requester. They can then choose to accept it.
        </p>
      </form>
    </Modal>
  );
};

export default MakeOfferModal;