// src/contexts/NotificationContext.tsx
import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { NotificationItem, NotificationContextType } from '../types.js'; // Corrected path

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);
const NOTIFICATIONS_STORAGE_KEY = 'gotodo-notifications_v2';

const generateId = () => `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const initialMockNotifications: NotificationItem[] = [
    { id: generateId(), message: "Welcome to gotodo.ai! We're excited to have you.", type: 'info', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), read: false, link: '/' },
    { id: generateId(), message: "Your profile setup is 80% complete. Finish it for better matches!", type: 'warning', timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), read: true, link: '/settings' },
];

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    try {
      const storedNotifications = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      if (storedNotifications) {
        const parsed = JSON.parse(storedNotifications) as NotificationItem[];
        // Ensure all items have the necessary fields after parsing
        return parsed.map(n => ({
            ...n,
            type: n.type || 'info', // Default if missing
            timestamp: n.timestamp || new Date().toISOString(),
            read: typeof n.read === 'boolean' ? n.read : false,
        })).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      }
    } catch (e) {
      console.error("Error loading notifications from localStorage:", e);
    }
    return initialMockNotifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  });

  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const count = notifications.filter(n => !n.read).length;
    setUnreadCount(count);
    try {
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications));
    } catch (e) {
      console.error("Error saving notifications to localStorage:", e);
    }
  }, [notifications]);

  const addNotification = useCallback((message: string, type: NotificationItem['type'], link?: string, relatedRequestId?: string) => {
    const newNotification: NotificationItem = {
      id: generateId(),
      message,
      type,
      timestamp: new Date().toISOString(),
      read: false,
      link,
      relatedRequestId,
    };
    setNotifications(prev => [newNotification, ...prev].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);
  
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const contextValue: NotificationContextType = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearAllNotifications
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};