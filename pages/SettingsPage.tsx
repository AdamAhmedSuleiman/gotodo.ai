// src/pages/SettingsPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext.js'; 
import { useToast } from '../contexts/ToastContext.js';
import Input from '../components/ui/Input.js';
import Button from '../components/ui/Button.js';
import Icon from '../components/ui/Icon.js';
import { ICON_PATHS } from '../constants.js';
import { NotificationPreferences, User, SavedPlace, SavedMember } from '../types.js';
import ContextualHelpPanel from '../components/ui/ContextualHelpPanel.js';
import * as userDataService from '../services/userDataService.js';
import AddSavedPlaceModal from '../components/settings/AddSavedPlaceModal.js';
import AddSavedMemberModal from '../components/settings/AddSavedMemberModal.js';
import LoadingSpinner from '../components/ui/LoadingSpinner.js';

const defaultNotificationPreferences: NotificationPreferences = {
  emailForNewBids: true,
  pushForStatusUpdates: true,
  promotionalOffers: false,
  platformAnnouncements: true,
};

const SettingsPage: React.FC = () => {
  const { user, updateUser, isLoading: authLoading } = useAuth(); 
  const { addToast } = useToast();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
  const [phone, setPhone] = useState('');
  const [newAvatarUrl, setNewAvatarUrl] = useState('');
  const [previewAvatarUrl, setPreviewAvatarUrl] = useState('');
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>(defaultNotificationPreferences);

  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([]);
  const [isAddPlaceModalOpen, setIsAddPlaceModalOpen] = useState(false);
  const [savedMembers, setSavedMembers] = useState<SavedMember[]>([]);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);

  const [isHelpPanelOpen, setIsHelpPanelOpen] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);


  const loadUserData = useCallback(async () => {
    if (user) {
      setIsLoadingData(true);
      setPhone(user.phone || '');
      const avatar = user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random&color=fff`;
      setNewAvatarUrl(user.avatarUrl || '');
      setPreviewAvatarUrl(avatar);
      setNotificationPrefs(user.notificationPreferences || { ...defaultNotificationPreferences });
      
      try {
        const places = await userDataService.getSavedPlaces(user.id);
        setSavedPlaces(places);
        const members = await userDataService.getSavedMembers(user.id);
        setSavedMembers(members);
      } catch (error) {
        addToast("Failed to load saved places/members.", "error");
        console.error("Error loading user data:", error);
      } finally {
        setIsLoadingData(false);
      }
    } else {
        setIsLoadingData(false);
    }
  }, [user, addToast]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  const handleAddSavedPlace = async (placeData: Omit<SavedPlace, 'id'>) => {
    if (!user) return;
    try {
      await userDataService.addSavedPlace(user.id, placeData);
      loadUserData(); // Reload to get the new list with ID from backend
      addToast("Saved place added!", "success");
    } catch (error) {
      addToast("Failed to add saved place.", "error");
    }
  };

  const handleDeleteSavedPlace = async (placeId: string) => {
    if (!user) return;
    try {
      await userDataService.deleteSavedPlace(user.id, placeId);
      loadUserData();
      addToast("Saved place deleted.", "info");
    } catch (error) {
      addToast("Failed to delete saved place.", "error");
    }
  };

  const handleAddSavedMember = async (memberData: Omit<SavedMember, 'id'>) => {
    if (!user) return;
    try {
      await userDataService.addSavedMember(user.id, memberData);
      loadUserData();
      addToast("Saved member added!", "success");
    } catch (error) {
      addToast("Failed to add saved member.", "error");
    }
  };

  const handleDeleteSavedMember = async (memberId: string) => {
    if (!user) return;
    try {
      await userDataService.deleteSavedMember(user.id, memberId);
      loadUserData();
      addToast("Saved member deleted.", "info");
    } catch (error) {
      addToast("Failed to delete saved member.", "error");
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSavingProfile(true);
    try {
      // In a real app, you would make an API call here to update the user profile on the backend.
      // e.g., await someUserService.updateProfile(user.id, { phone, avatarUrl: newAvatarUrl.trim() || undefined, notificationPreferences: notificationPrefs });
      // For now, we update locally via AuthContext's updateUser, which updates localStorage cache.
      updateUser({ 
        phone, 
        avatarUrl: newAvatarUrl.trim() || undefined, 
        notificationPreferences: notificationPrefs 
      });
      addToast("Profile updated successfully! (Locally)", "success");
    } catch (error) {
      addToast("Failed to update profile.", "error");
      console.error("Profile update error:", error);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    if (newPassword !== confirmNewPassword) {
      setPasswordError("New passwords do not match."); addToast("New passwords do not match.", "error"); return;
    }
    if (newPassword.length < 6) {
        setPasswordError("New password must be at least 6 characters long."); addToast("New password must be at least 6 characters long.", "error"); return;
    }
    setIsSavingPassword(true);
    // Mock API call for password change
    setTimeout(() => {
      // In a real app: await authService.changePassword(user.id, currentPassword, newPassword);
      addToast("Password changed successfully! (Mock)", "success");
      setCurrentPassword(''); setNewPassword(''); setConfirmNewPassword('');
      setIsSavingPassword(false);
    }, 1000);
  };
  
  const handleNotifPrefChange = (prefKey: keyof NotificationPreferences) => {
    setNotificationPrefs(prev => ({
      ...prev,
      [prefKey]: !prev[prefKey]
    } as NotificationPreferences));
  };
  
  const handleAvatarUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewAvatarUrl(e.target.value);
    setPreviewAvatarUrl(e.target.value.trim() || (user ? `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random&color=fff` : ''));
  };


  if (authLoading || isLoadingData || !user) {
    return <div className="container mx-auto p-6 text-center"><LoadingSpinner text="Loading user settings..." /></div>;
  }

  return (
    <>
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-8">Settings</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <section className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4">Profile Information</h2>
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div className="flex flex-col items-center sm:flex-row sm:items-start sm:space-x-4">
                <img 
                    src={previewAvatarUrl}
                    alt={`${user.name}'s avatar`}
                    className="w-24 h-24 rounded-full object-cover mb-4 sm:mb-0 border-2 border-gray-300 dark:border-gray-600" 
                    onError={(e) => (e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random&color=fff`)}
                />
                <div className="flex-grow w-full">
                    <Input label="Name" name="name" type="text" value={user.name} disabled className="bg-gray-100 dark:bg-gray-700 cursor-not-allowed"/>
                    <Input label="Email" name="email" type="email" value={user.email} disabled className="bg-gray-100 dark:bg-gray-700 cursor-not-allowed"/>
                </div>
              </div>
              <Input label="Avatar URL" name="avatarUrl" type="url" value={newAvatarUrl} onChange={handleAvatarUrlChange} placeholder="https://example.com/avatar.png" />
              <Input label="Phone Number" name="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g., 555-123-4567" />
              
              <div className="pt-4 border-t dark:border-gray-700">
                <Button type="submit" variant="primary" isLoading={isSavingProfile}>Save Profile Changes</Button>
              </div>
            </form>
          </section>

          <section className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4">Change Password (Mock)</h2>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              {passwordError && <p className="text-sm text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900 dark:bg-opacity-30 p-2 rounded-md">{passwordError}</p>}
              <Input label="Current Password" name="currentPassword" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
              <Input label="New Password" name="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
              <Input label="Confirm New Password" name="confirmNewPassword" type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} required />
              <Button type="submit" variant="secondary" isLoading={isSavingPassword} className="dark:bg-gray-600 dark:hover:bg-gray-500">Change Password</Button>
            </form>
          </section>
        </div>

        <div className="md:col-span-1 space-y-6">
          <section className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4">Notification Preferences</h2>
            <div className="space-y-3">
              {Object.entries(notificationPrefs).map(([key, value]) => (
                <label key={key} className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-gray-700 dark:text-gray-300">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
                  <input type="checkbox" checked={Boolean(value)} onChange={() => handleNotifPrefChange(key as keyof NotificationPreferences)} 
                         className="relative w-10 h-5 bg-gray-300 rounded-full appearance-none cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 checked:bg-blue-600 dark:checked:bg-blue-500
                                    after:absolute after:top-0.5 after:left-0.5 after:w-4 after:h-4 after:bg-white after:rounded-full after:shadow-sm after:transition-transform after:duration-200 after:ease-in-out checked:after:translate-x-full" />
                </label>
              ))}
            </div>
             <Button onClick={handleProfileUpdate} variant="outline" size="sm" className="mt-4 w-full dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700" isLoading={isSavingProfile}>Save Notification Preferences</Button>
          </section>

          <section className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-3">Saved Places</h2>
            {isLoadingData ? <LoadingSpinner size="sm"/> : savedPlaces.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">No saved places yet.</p>}
            <ul className="space-y-2 max-h-48 overflow-y-auto mb-3">
              {savedPlaces.map(place => (
                <li key={place.id} className="flex justify-between items-center text-sm p-2 bg-gray-50 dark:bg-gray-700 rounded">
                  <div>
                    <span className="font-medium text-gray-800 dark:text-gray-100">{place.name}</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[150px] sm:max-w-xs" title={place.location.address}>{place.location.address}</p>
                  </div>
                  <Button variant="ghost" size="xs" onClick={() => handleDeleteSavedPlace(place.id)} className="text-red-500 dark:text-red-400 p-1"><Icon path={ICON_PATHS.TRASH_ICON} className="w-4 h-4"/></Button>
                </li>
              ))}
            </ul>
            <Button onClick={() => setIsAddPlaceModalOpen(true)} variant="outline" size="sm" className="w-full dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700" leftIcon={<Icon path={ICON_PATHS.PLUS_CIRCLE} className="w-4 h-4"/>}>Add Saved Place</Button>
          </section>

          <section className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-3">Saved Members/Recipients</h2>
            {isLoadingData ? <LoadingSpinner size="sm"/> : savedMembers.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">No saved members yet.</p>}
            <ul className="space-y-2 max-h-48 overflow-y-auto mb-3">
              {savedMembers.map(member => (
                <li key={member.id} className="flex justify-between items-center text-sm p-2 bg-gray-50 dark:bg-gray-700 rounded">
                  <div>
                    <span className="font-medium text-gray-800 dark:text-gray-100">{member.name} {member.details?.name && member.details.name !== member.name ? `(${member.details.name})` : ''}</span>
                    {member.details?.contact && <p className="text-xs text-gray-500 dark:text-gray-400">{member.details.contact}</p>}
                    {member.details?.addressString && <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[150px] sm:max-w-xs" title={member.details.addressString}>{member.details.addressString}</p>}
                  </div>
                  <Button variant="ghost" size="xs" onClick={() => handleDeleteSavedMember(member.id)} className="text-red-500 dark:text-red-400 p-1"><Icon path={ICON_PATHS.TRASH_ICON} className="w-4 h-4"/></Button>
                </li>
              ))}
            </ul>
            <Button onClick={() => setIsAddMemberModalOpen(true)} variant="outline" size="sm" className="w-full dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700" leftIcon={<Icon path={ICON_PATHS.USER_PLUS_ICON} className="w-4 h-4"/>}>Add Saved Member</Button>
          </section>
        </div>
      </div>
      
      <Button
        onClick={() => setIsHelpPanelOpen(true)}
        variant="ghost"
        className="fixed bottom-6 right-6 p-3 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-offset-gray-900"
        aria-label="Help"
      >
        <Icon path={ICON_PATHS.QUESTION_MARK_CIRCLE} className="w-6 h-6" />
      </Button>

      <AddSavedPlaceModal isOpen={isAddPlaceModalOpen} onClose={() => setIsAddPlaceModalOpen(false)} onSave={handleAddSavedPlace} />
      <AddSavedMemberModal isOpen={isAddMemberModalOpen} onClose={() => setIsAddMemberModalOpen(false)} onSave={handleAddSavedMember} />
      <ContextualHelpPanel 
        isOpen={isHelpPanelOpen}
        onClose={() => setIsHelpPanelOpen(false)}
        pageKey="settings-page"
      />
    </div>
    </>
  );
};

export default SettingsPage;
