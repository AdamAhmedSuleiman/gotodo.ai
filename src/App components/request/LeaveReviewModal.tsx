// src/components/request/LeaveReviewModal.tsx
import React, { useState } from 'react';
import Modal from '../ui/Modal.js';
import Button from '../ui/Button.js';
import Textarea from '../ui/Textarea.js';
import StarRating from '../ui/StarRating.js';
import { LeaveReviewModalProps } from '../../types.js';

const LeaveReviewModal: React.FC<LeaveReviewModalProps> = ({
  isOpen,
  onClose,
  onSubmitReview,
  requestSummary,
}) => {
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    if (rating === 0) {
      setError('Please select a star rating.');
      return;
    }
    if (!reviewText.trim()) {
      setError('Please provide a short review text.');
      return;
    }
    setError(null);
    onSubmitReview(rating, reviewText);
    setRating(0); 
    setReviewText('');
  };
  
  const handleClose = () => {
    setRating(0);
    setReviewText('');
    setError(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Leave a Review for "${requestSummary}"`}
      size="lg"
      footer={
        <div className="flex justify-end space-x-3">
          <Button variant="secondary" onClick={handleClose} className="dark:bg-gray-600 dark:hover:bg-gray-500">
            Cancel
          </Button>
          <Button onClick={handleSubmit} variant="primary">
            Submit Review
          </Button>
        </div>
      }
    >
      <div className="space-y-4 p-1">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Your Rating:</label>
          <StarRating rating={rating} onRatingChange={setRating} size="lg" />
        </div>
        <Textarea
          label="Your Review:"
          name="reviewText"
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          placeholder="Share your experience..."
          rows={4}
          required
        />
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      </div>
    </Modal>
  );
};

export default LeaveReviewModal;