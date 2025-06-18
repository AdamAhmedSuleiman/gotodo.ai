// src/components/admin/BroadcastMessagePanel.tsx
import React, { useState } from 'react';
import Button from '../ui/Button.js';
import Textarea from '../ui/Textarea.js';
import { useToast } from '../../contexts/ToastContext.js';
import { UserRole } from '../../types.js';

type BroadcastTarget = 'all' | UserRole.REQUESTER | UserRole.PROVIDER;

const BroadcastMessagePanel: React.FC = () => {
  const [message, setMessage] = useState('');
  const [targetAudience, setTargetAudience] = useState<BroadcastTarget>('all');
  const { addToast } = useToast();

  const handleSendBroadcast = () => {
    if (!message.trim()) {
      addToast("Broadcast message cannot be empty.", "error");
      return;
    }
    // Mock sending broadcast
    console.log(`Broadcasting to "${targetAudience}": "${message}"`);
    addToast(`Broadcast message sent to ${targetAudience} (mock).`, 'success');
    setMessage('');
  };

  return (
    <div className="space-y-4">
      <Textarea
        label="Broadcast Message"
        name="broadcastMessage"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Enter your important announcement here..."
        rows={4}
        required
      />
      <div>
        <label htmlFor="targetAudience" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Target Audience</label>
        <select
          id="targetAudience"
          name="targetAudience"
          value={targetAudience}
          onChange={(e) => setTargetAudience(e.target.value as BroadcastTarget)}
          className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700 dark:text-gray-100"
        >
          <option value="all">All Users</option>
          <option value={UserRole.REQUESTER}>Requesters Only</option>
          <option value={UserRole.PROVIDER}>Providers Only</option>
        </select>
      </div>
      <Button onClick={handleSendBroadcast} variant="primary" fullWidth>
        Send Broadcast
      </Button>
    </div>
  );
};

export default BroadcastMessagePanel;