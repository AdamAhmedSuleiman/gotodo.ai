// src/components/layout/Header.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.js';
import { useNotifications } from '../../contexts/NotificationContext.js';
import { useTheme } from '../../contexts/ThemeContext.js';
import { APP_NAME, ICON_PATHS } from '../../constants.js';
import Icon from '../ui/Icon.js';
import Button from '../ui/Button.js';
import { Transition } from '@headlessui/react';
import { NotificationItem, UserRole } from '../../types.js';

const Header: React.FC = () => {
  const { user, isAuthenticated, logout, setUserRole, isLoading: authLoading } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAllNotifications } = useNotifications();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const notificationsPanelRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const toggleNotifications = () => {
    setIsNotificationsOpen(prev => !prev);
    setIsUserMenuOpen(false);
  };

  const toggleUserMenu = () => {
    setIsUserMenuOpen(prev => !prev);
    setIsNotificationsOpen(false);
  };

  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (notificationsPanelRef.current && !notificationsPanelRef.current.contains(event.target as Node)) {
      setIsNotificationsOpen(false);
    }
    if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
      setIsUserMenuOpen(false);
    }
  }, []);

  useEffect(() => {
    if (isNotificationsOpen || isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isNotificationsOpen, isUserMenuOpen, handleClickOutside]);

  const getIconForNotificationType = (type: NotificationItem['type']) => {
    switch (type) {
      case 'success': return <Icon path={ICON_PATHS.CHECK_CIRCLE} className="w-5 h-5 text-green-500 dark:text-green-400" />;
      case 'warning': return <Icon path={ICON_PATHS.EXCLAMATION_TRIANGLE} className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />;
      case 'error': return <Icon path={ICON_PATHS.X_CIRCLE} className="w-5 h-5 text-red-500 dark:text-red-400" />;
      case 'new_request': return <Icon path={ICON_PATHS.BELL} className="w-5 h-5 text-purple-500 dark:text-purple-400" />;
      case 'bid_received': return <Icon path={ICON_PATHS.BANKNOTES} className="w-5 h-5 text-teal-500 dark:text-teal-400" />;
      case 'task_update': return <Icon path={ICON_PATHS.CLIPBOARD_DOCUMENT_LIST_ICON} className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />;
      case 'payment_update': return <Icon path={ICON_PATHS.CREDIT_CARD} className="w-5 h-5 text-pink-500 dark:text-pink-400" />;
      case 'chat_message': return <Icon path={ICON_PATHS.CHAT_BUBBLE_LEFT_RIGHT} className="w-5 h-5 text-cyan-500 dark:text-cyan-400" />;
      case 'info':
      default: return <Icon path={ICON_PATHS.INFORMATION_CIRCLE} className="w-5 h-5 text-blue-500 dark:text-blue-400" />;
    }
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-40 transition-colors duration-300">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 text-2xl font-bold text-blue-600 dark:text-blue-400">
              {APP_NAME}
            </Link>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-3">
            {authLoading ? (
              <div className="text-sm text-gray-500 dark:text-gray-400">Loading...</div>
            ) : isAuthenticated && user ? (
              <>
                {/* Desktop User Info & Actions */}
                <div className="hidden md:flex items-center space-x-2">
                    <img
                        src={user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random&color=fff&size=32`}
                        alt={`${user.name}'s avatar`}
                        className="w-8 h-8 rounded-full object-cover border border-gray-300 dark:border-gray-600"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Welcome, {user.name}! ({user.role})</span>
                </div>

                {user.role !== UserRole.ADMIN && (
                   <select
                    id="desktop-role-switcher"
                    name="desktop-role-switcher"
                    value={user.role}
                    onChange={(e) => setUserRole(e.target.value as UserRole)}
                    className="text-xs p-1 border rounded hidden md:block bg-white dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
                    aria-label="Switch user role"
                  >
                    <option value={UserRole.REQUESTER}>Requester</option>
                    <option value={UserRole.PROVIDER}>Provider</option>
                  </select>
                )}
                {user.role === UserRole.ADMIN && (
                   <Link to="/admin-portal" className="text-sm p-1.5 rounded-md text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-gray-700 hidden md:block">Admin Portal</Link>
                )}

                <button
                  onClick={toggleTheme}
                  className="p-1.5 rounded-full text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                  aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                >
                  <Icon path={theme === 'light' ? ICON_PATHS.MOON : ICON_PATHS.SUN} className="w-6 h-6" />
                </button>

                <div className="relative" ref={notificationsPanelRef}>
                  <button
                    onClick={toggleNotifications}
                    className="p-1.5 rounded-full text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                    aria-label="View notifications"
                    aria-haspopup="true"
                    aria-expanded={isNotificationsOpen}
                  >
                    <Icon path={ICON_PATHS.BELL} className="w-6 h-6" />
                    {unreadCount > 0 && (
                      <span className="absolute top-0 right-0 block h-2.5 w-2.5 transform -translate-y-1/2 translate-x-1/2 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-800" />
                    )}
                  </button>
                  <Transition
                    show={isNotificationsOpen}
                    as={React.Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                  >
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 origin-top-right bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 divide-y divide-gray-100 dark:divide-gray-600 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none max-h-[70vh] flex flex-col">
                      <div className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Notifications ({unreadCount} unread)</p>
                      </div>
                      <div className="py-1 overflow-y-auto flex-grow">
                        {notifications.length === 0 ? (
                          <p className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">No new notifications.</p>
                        ) : (
                          notifications.map((notif) => (
                            <div
                              key={notif.id}
                              onClick={() => {
                                markAsRead(notif.id);
                                if (notif.link) navigate(notif.link);
                                setIsNotificationsOpen(false);
                              }}
                              className={`block px-4 py-3 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 ${notif.read ? 'text-gray-500 dark:text-gray-400' : 'text-gray-800 dark:text-gray-100 font-medium'}`}
                            >
                              <div className="flex items-start space-x-2">
                                <div className="flex-shrink-0 mt-0.5">{getIconForNotificationType(notif.type)}</div>
                                <div className="flex-grow">
                                  <p className="truncate">{notif.message}</p>
                                  <p className={`text-xs ${notif.read ? 'text-gray-400 dark:text-gray-500' : 'text-blue-500 dark:text-blue-400'}`}>
                                    {new Date(notif.timestamp).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      {notifications.length > 0 && (
                         <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 flex justify-between items-center">
                            <Button variant="ghost" size="sm" onClick={() => { markAllAsRead(); }} disabled={unreadCount === 0} className="dark:text-gray-300 dark:hover:bg-gray-600">
                                Mark all as read
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => { clearAllNotifications(); setIsNotificationsOpen(false); }} className="dark:text-gray-300 dark:hover:bg-gray-600">
                                Clear All
                            </Button>
                        </div>
                      )}
                    </div>
                  </Transition>
                </div>

                <div className="hidden md:flex items-center space-x-2">
                    <Link to="/settings" className="p-1.5 rounded-full text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800" aria-label="Settings">
                    <Icon path={ICON_PATHS.COG_6_TOOTH} className="w-6 h-6" />
                    </Link>
                    <Button
                    onClick={handleLogout}
                    variant="secondary"
                    size="sm"
                    className="dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-gray-200 dark:border-gray-500"
                    leftIcon={<Icon path={ICON_PATHS.ARROW_RIGHT_ON_RECTANGLE} className="w-5 h-5" />}
                    >
                    Logout
                    </Button>
                </div>

                {/* Mobile User Menu (User Icon) */}
                <div className="md:hidden relative" ref={userMenuRef}>
                  <button
                    onClick={toggleUserMenu}
                    className="p-1.5 rounded-full text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="Open user menu"
                    aria-haspopup="true"
                    aria-expanded={isUserMenuOpen}
                  >
                     <img
                        src={user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random&color=fff&size=32`}
                        alt="User menu"
                        className="w-7 h-7 rounded-full object-cover"
                    />
                  </button>
                  <Transition
                    show={isUserMenuOpen}
                    as={React.Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                  >
                    <div className="absolute right-0 mt-2 w-56 origin-top-right bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 divide-y divide-gray-100 dark:divide-gray-600 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                      <div className="px-4 py-3">
                        <p className="text-sm text-gray-900 dark:text-gray-100">Signed in as</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{user.name} ({user.role})</p>
                      </div>
                      <div className="py-1">
                        {user.role !== UserRole.ADMIN && (
                            <div className="px-4 py-2">
                                <label htmlFor="mobile-role-switcher" className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Switch Role:</label>
                                <select
                                    id="mobile-role-switcher"
                                    name="mobile-role-switcher"
                                    value={user.role}
                                    onChange={(e) => { setUserRole(e.target.value as UserRole); setIsUserMenuOpen(false); }}
                                    className="w-full text-sm p-1.5 border rounded bg-white dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500"
                                >
                                    <option value={UserRole.REQUESTER}>Requester</option>
                                    <option value={UserRole.PROVIDER}>Provider</option>
                                </select>
                            </div>
                        )}
                        {user.role === UserRole.ADMIN && (
                            <Link to="/admin-portal" onClick={() => setIsUserMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600">Admin Portal</Link>
                        )}
                        <Link to="/settings" onClick={() => setIsUserMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600">
                          Settings
                        </Link>
                      </div>
                      <div className="py-1">
                        <button
                          onClick={() => { handleLogout(); setIsUserMenuOpen(false); }}
                          className="block w-full text-left px-4 py-2 text-sm text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-700/30"
                        >
                          Logout
                        </button>
                      </div>
                    </div>
                  </Transition>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
                  Login
                </Link>
                <Link
                  to="/register"
                  className="ml-2 sm:ml-4 inline-flex items-center justify-center px-3 py-1.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;