// src/components/shared/ChatModal.tsx
import React, { useState, useEffect, useRef } from 'react';
import Modal from '../ui/Modal.js';
import Button from '../ui/Button.js';
import Textarea from '../ui/Textarea.js';
import Icon from '../ui/Icon.js';
import { ICON_PATHS } from '../../constants.js';
import { ChatModalProps, ChatMessage, User, UserRole } from '../../types.js'; // Added UserRole
import { useNotifications } from '../../contexts/NotificationContext.js';

const ChatModal: React.FC<ChatModalProps> = ({
  isOpen,
  onClose,
  requestId,
  currentUser,
  otherPartyName,
  initialMessages,
  onSendMessage,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [newMessageText, setNewMessageText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { addNotification } = useNotifications();
  const simulationIntervalRef = useRef<number | null>(null);
  const lastMessageTimestampRef = useRef<string>(initialMessages[initialMessages.length -1]?.timestamp || new Date(0).toISOString());


  useEffect(() => {
    setMessages(initialMessages); 
    if(initialMessages.length > 0) {
        lastMessageTimestampRef.current = initialMessages[initialMessages.length -1].timestamp;
    } else {
        lastMessageTimestampRef.current = new Date(0).toISOString();
    }
  }, [initialMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      // Reset last seen timestamp when modal opens
      lastMessageTimestampRef.current = messages[messages.length -1]?.timestamp || new Date().toISOString();

      simulationIntervalRef.current = window.setInterval(() => {
        const mockReplies = [
          "Okay, I understand.", "Thanks for the update!", "Working on it now.",
          "Could you please clarify?", "I'll let you know once it's done.", "Sounds good.",
          "Yes, that should be fine.", "Let me check on that for you.", "No problem at all.",
          "I'm on my way.", "Almost there!", "Can you send a picture?"
        ];
        const randomReply = mockReplies[Math.floor(Math.random() * mockReplies.length)];
        
        const simulatedMessage: ChatMessage = {
          id: `sim-msg-${Date.now()}`,
          requestId,
          senderId: `other-party-${requestId}`, // Generic ID for the other party
          senderName: otherPartyName,
          text: randomReply,
          timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, simulatedMessage]);
        // Don't update lastMessageTimestampRef.current here for simulated messages from other party
      }, Math.random() * 25000 + 15000); // Random interval between 15-40 seconds
    } else {
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
        simulationIntervalRef.current = null;
      }
      // Check for "missed" messages based on timestamp when modal was last open
      const latestMessage = messages[messages.length - 1];
      if (latestMessage && new Date(latestMessage.timestamp) > new Date(lastMessageTimestampRef.current) && latestMessage.senderId !== currentUser.id) {
          addNotification(
            `New message from ${otherPartyName}: "${latestMessage.text.substring(0,20)}..."`, 
            'chat_message', 
            // Determine link based on user role or a generic task view page
            currentUser.role === UserRole.REQUESTER ? `/requester-portal?chatWith=${requestId}` : `/provider-portal?chatWith=${requestId}`, 
            requestId
          );
      }
    }
    return () => {
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
      }
    };
  }, [isOpen, requestId, otherPartyName, currentUser.id, currentUser.role, addNotification, messages]); // Added messages to dependency array for accurate latestMessage check


  const handleSendMessage = () => {
    if (!newMessageText.trim()) return;

    const message: ChatMessage = {
      id: `msg-${Date.now()}`,
      requestId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      text: newMessageText.trim(),
      timestamp: new Date().toISOString(),
    };
    onSendMessage(requestId, message); 
    setMessages(prev => [...prev, message]); 
    lastMessageTimestampRef.current = message.timestamp; // Update for user's own messages
    setNewMessageText('');
  };
  
  const handleModalClose = () => {
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
      simulationIntervalRef.current = null;
    }
    const latestMessage = messages[messages.length - 1];
    if (latestMessage && new Date(latestMessage.timestamp) > new Date(lastMessageTimestampRef.current) && latestMessage.senderId !== currentUser.id) {
        addNotification(
          `New message from ${otherPartyName}: "${latestMessage.text.substring(0,20)}..."`, 
          'chat_message', 
          currentUser.role === UserRole.REQUESTER ? `/requester-portal?chatWith=${requestId}` : `/provider-portal?chatWith=${requestId}`, 
          requestId
        );
    }
    onClose();
  };


  return (
    <Modal
      isOpen={isOpen}
      onClose={handleModalClose}
      title={`Chat with ${otherPartyName} (Request #${requestId.substring(0,6)}...)`}
      size="lg"
      footer={
        <div className="flex items-center space-x-2">
          <Textarea
            name="newMessage"
            aria-label="Type your message" 
            value={newMessageText}
            onChange={(e) => setNewMessageText(e.target.value)}
            placeholder="Type your message..."
            rows={1}
            className="flex-grow resize-none py-1.5" 
            wrapperClassName="flex-grow mb-0"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <Button onClick={handleSendMessage} disabled={!newMessageText.trim()} variant="primary" size="md">
            Send
          </Button>
        </div>
      }
    >
      <div className="h-[50vh] flex flex-col p-1">
        <div className="flex-grow overflow-y-auto space-y-3 pr-2 mb-3">
          {messages.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-4">No messages yet. Start the conversation!</p>
          ) : (
            messages.map((msg) => {
              const isCurrentUserSender = msg.senderId === currentUser.id;
              return (
                <div
                  key={msg.id}
                  className={`flex ${isCurrentUserSender ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] p-2.5 rounded-lg shadow ${
                      isCurrentUserSender
                        ? 'bg-blue-500 text-white dark:bg-blue-600'
                        : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                    }`}
                  >
                    <p className="text-sm break-words">{msg.text}</p>
                    <p className={`text-xs mt-1 ${isCurrentUserSender ? 'text-blue-200 dark:text-blue-300' : 'text-gray-500 dark:text-gray-400'} text-right`}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
    </Modal>
  );
};

export default ChatModal;