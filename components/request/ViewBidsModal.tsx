// src/components/request/ViewBidsModal.tsx
import React from 'react';
import Modal from '../ui/Modal.js'; 
import Button from '../ui/Button.js'; 
import Icon from '../ui/Icon.js'; 
import { ICON_PATHS } from '../../constants.js'; 
import { ViewBidsModalProps, MockProviderBid } from '../../types.js'; 

const ViewBidsModal: React.FC<ViewBidsModalProps> = ({
  isOpen,
  onClose,
  request,
  onAcceptBid,
  onViewProviderProfile,
}) => {
  if (!request.bids || request.bids.length === 0) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="View Bids/Applicants" size="lg">
        <p className="text-gray-600 dark:text-gray-400 text-center py-4">
          No bids or applications received for this request yet.
        </p>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Bids/Applicants for: "${request.textInput || request.aiAnalysisSummary || request.id.substring(0,8)}"`}
      size="2xl" // Increased size for better content display
      hideDefaultCloseButton={true}
      footer={
        <div className="flex justify-end">
            <Button variant="secondary" onClick={onClose} className="dark:bg-gray-600 dark:hover:bg-gray-500">Close</Button>
        </div>
      }
    >
      <div className="space-y-4 max-h-[60vh] overflow-y-auto p-1 pr-2"> {/* Added padding and pr for scrollbar */}
        {request.bids.map((bid, index) => (
          <div key={bid.providerId + index} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg shadow border border-gray-200 dark:border-gray-600">
            <div className="flex items-start space-x-3">
              <img 
                src={bid.providerAvatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(bid.providerName)}&background=random&color=fff`}
                alt={`${bid.providerName}'s avatar`}
                className="w-12 h-12 rounded-full object-cover flex-shrink-0 border border-gray-300 dark:border-gray-500"
              />
              <div className="flex-grow">
                <div className="flex justify-between items-center">
                  <h4 className="text-md font-semibold text-blue-700 dark:text-blue-400">{bid.providerName}</h4>
                  <span className="text-lg font-bold text-green-600 dark:text-green-400">${bid.bidAmount.toFixed(2)}</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 italic">"{bid.message}"</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Submitted: {new Date(bid.timestamp).toLocaleString()}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button 
                    variant="primary" 
                    size="sm" 
                    onClick={() => onAcceptBid(bid)}
                    leftIcon={<Icon path={ICON_PATHS.CHECK_CIRCLE} className="w-4 h-4" />}
                  >
                    Accept Bid
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => onViewProviderProfile(bid.providerId)}
                    className="dark:text-gray-300 dark:border-gray-500 dark:hover:bg-gray-600"
                  >
                    View Profile
                  </Button>
                   <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => alert(`Chat with ${bid.providerName} (Not Implemented)`)}
                    className="dark:text-blue-400 dark:hover:bg-gray-600"
                  >
                     <Icon path={ICON_PATHS.CHAT_BUBBLE_LEFT_RIGHT} className="w-4 h-4 mr-1"/> Chat
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
};

export default ViewBidsModal;