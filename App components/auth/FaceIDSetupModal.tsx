// src/components/auth/FaceIDSetupModal.tsx
import React, { useState } from 'react';
import Modal from '../ui/Modal.js';
import Button from '../ui/Button.js';
import Icon from '../ui/Icon.js';
import { ICON_PATHS, APP_NAME } from '../../constants.js';
import { FaceIDSetupModalProps } from '../../types.js';
import LoadingSpinner from '../ui/LoadingSpinner.js';

const FaceIDSetupModal: React.FC<FaceIDSetupModalProps> = ({
  isOpen,
  onClose,
  onSetupComplete,
  userName,
}) => {
  const [isSimulating, setIsSimulating] = useState(false);
  const [setupMessage, setSetupMessage] = useState<string | null>(null);

  const handleSetupNow = async () => {
    setIsSimulating(true);
    setSetupMessage("Simulating Face Scan...");
    await new Promise(resolve => setTimeout(resolve, 2500));
    setSetupMessage(`Face ID successfully simulated for ${userName}!`);
    onSetupComplete(); 
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSimulating(false);
    setSetupMessage(null);
    onClose();
  };

  const handleMaybeLater = () => {
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={isSimulating ? () => {} : handleMaybeLater}
      title="Enhance Your Security with Face ID"
      size="md"
      footer={!isSimulating && !setupMessage ? (
        <div className="flex justify-end space-x-3">
          <Button variant="secondary" onClick={handleMaybeLater} className="dark:bg-gray-600 dark:hover:bg-gray-500">
            Maybe Later
          </Button>
          <Button onClick={handleSetupNow} variant="primary">
            Set Up Face ID Now
          </Button>
        </div>
      ) : null}
    >
      <div className="text-center p-4">
        {isSimulating || setupMessage ? (
          <>
            {isSimulating && <LoadingSpinner text={setupMessage || "Processing..."} />}
            {!isSimulating && setupMessage && (
               <div className="flex flex-col items-center">
                 <Icon path={ICON_PATHS.CHECK_CIRCLE} className="w-12 h-12 text-green-500 dark:text-green-400 mb-3" />
                 <p className="text-lg font-medium text-gray-700 dark:text-gray-200">{setupMessage}</p>
               </div>
            )}
          </>
        ) : (
          <>
            <Icon path={ICON_PATHS.FACE_SMILE} className="w-16 h-16 text-blue-500 dark:text-blue-400 mx-auto mb-4" />
            <p className="text-lg text-gray-700 dark:text-gray-200 mb-2">
              Hi {userName}, would you like to set up Face ID for quicker and more secure access to {APP_NAME}?
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              This is a simulated setup for demonstration purposes.
            </p>
          </>
        )}
      </div>
    </Modal>
  );
};

export default FaceIDSetupModal;