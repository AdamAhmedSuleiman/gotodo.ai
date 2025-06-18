// src/pages/AdminPortalPage.tsx
import React, { useState, useEffect } from 'react';
import { AdminUserView, FlaggedRequestView, UserRole, RequestStatus, DisputeDetails, User } from '../src/types.js'; 
import Icon from '../App components/ui/Icon.js';
import { ICON_PATHS } from '../src/constants.js';
import Button from '../App components/ui/Button.js';
import LoadingSpinner from '../App components/ui/LoadingSpinner.js';
import FlaggedRequestDetailsModal from '../App components/admin/FlaggedRequestDetailsModal.js';
import AdminUserDetailsModal from '../App components/admin/AdminUserDetailsModal.js'; 
import ContextualHelpPanel from '../App components/ui/ContextualHelpPanel.js';
import { useToast } from '../contexts/ToastContext.js'; 
import { mockUpdateUserStatus } from '../services/authService.js'; 

// Mock Data (ensure users have status)
const mockAdminUsers: AdminUserView[] = [
  { id: 'requester1', email: 'requester@example.com', name: 'John Doe', role: UserRole.REQUESTER, faceIdRegistered: true, avatarUrl: 'https://picsum.photos/seed/requester1/100/100', status: 'active', registrationDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(), lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() },
  { id: 'provider1', email: 'provider@example.com', name: 'Jane Smith', role: UserRole.PROVIDER, faceIdRegistered: true, avatarUrl: 'https://picsum.photos/seed/provider1/100/100', status: 'active', registrationDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(), lastLogin: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
  { id: 'admin1', email: 'admin@example.com', name: 'Admin User', role: UserRole.ADMIN, faceIdRegistered: false, avatarUrl: 'https://picsum.photos/seed/admin1/100/100', status: 'active', registrationDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 100).toISOString(), lastLogin: new Date().toISOString() },
  { id: 'user_pending', email: 'pending@example.com', name: 'Pending User', role: UserRole.REQUESTER, faceIdRegistered: false, status: 'pending_verification', registrationDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString() },
  { id: 'user_suspended', email: 'suspended@example.com', name: 'Suspended User', role: UserRole.PROVIDER, faceIdRegistered: true, status: 'suspended', registrationDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(), lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()  },
];

const mockFlaggedRequests: FlaggedRequestView[] = [
  { id: 'flaggedreq1', textInput: "Request with inappropriate language for 'item delivery'.", type: UserRole.REQUESTER as any, creationDate: new Date(Date.now() - 1000 * 60 * 30).toISOString(), status: RequestStatus.PENDING, flaggedBy: 'System', reason: 'Inappropriate language detected.', flagDate: new Date().toISOString() },
  { id: 'flaggedreq2', aiAnalysisSummary: "Suspicious ride request to an unusual location late at night.", type: UserRole.PROVIDER as any, creationDate: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), status: RequestStatus.PENDING, flaggedBy: 'user_report_id_xyz', reason: 'User reported suspicious activity.', flagDate: new Date(Date.now() - 1000 * 60 * 5).toISOString() },
  { 
    id: 'disputedreq1', 
    textInput: "Plumbing service was incomplete, and the provider was rude.", 
    type: UserRole.REQUESTER as any, // This type should be ServiceType for consistency, but adapting to current structure
    creationDate: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), 
    status: RequestStatus.DISPUTED, 
    providerId: 'provider1',
    assignedProviderName: 'Jane Smith',
    requesterId: 'requester1',
    disputeDetails: {
        reason: "Service not as described",
        description: "The plumber only fixed half of the issues mentioned and was very dismissive when I pointed it out. The faucet is still leaking slightly.",
        reportedDate: new Date(Date.now() - 1000 * 60 * 15).toISOString()
    },
    flaggedBy: 'requester1', 
    reason: 'User Dispute: Service not as described',
    flagDate: new Date(Date.now() - 1000 * 60 * 15).toISOString()
  }
];


const AdminPortalPage: React.FC = () => {
  const [users, setUsers] = useState<AdminUserView[]>(mockAdminUsers);
  const [flaggedRequests, setFlaggedRequests] = useState<FlaggedRequestView[]>(mockFlaggedRequests);
  const [isLoading, setIsLoading] = useState(false); // Set to false initially, or true if loading data async
  const { addToast } = useToast();

  const [selectedFlaggedRequest, setSelectedFlaggedRequest] = useState<FlaggedRequestView | null>(null);
  const [isFlaggedRequestModalOpen, setIsFlaggedRequestModalOpen] = useState(false);

  const [selectedUser, setSelectedUser] = useState<AdminUserView | null>(null);
  const [isUserDetailsModalOpen, setIsUserDetailsModalOpen] = useState(false);
  
  const [isHelpPanelOpen, setIsHelpPanelOpen] = useState(false);

  const openFlaggedRequestDetails = (request: FlaggedRequestView) => {
    setSelectedFlaggedRequest(request);
    setIsFlaggedRequestModalOpen(true);
  };
  
  const openUserDetails = (user: AdminUserView) => {
    setSelectedUser(user);
    setIsUserDetailsModalOpen(true);
  };

  const handleToggleUserStatus = async (userId: string, currentStatus?: 'active' | 'suspended' | 'pending_verification') => {
    const targetStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
    try {
      const updatedUser = await mockUpdateUserStatus(userId, targetStatus);
      setUsers(prevUsers => prevUsers.map(u => u.id === userId ? { ...u, status: updatedUser.status as AdminUserView['status'] } : u));
      // Update selectedUser if it's the one being modified to reflect status change in modal
      if (selectedUser && selectedUser.id === userId) {
        setSelectedUser(prev => prev ? { ...prev, status: updatedUser.status as AdminUserView['status'] } : null);
      }
      addToast(`User ${updatedUser.name} has been ${targetStatus}.`, 'success');
    } catch (error) {
      addToast(`Failed to update user status: ${(error as Error).message}`, 'error');
    }
  };


  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><LoadingSpinner text="Loading Admin Dashboard..." /></div>;
  }

  const getStatusChipClass = (status?: 'active' | 'suspended' | 'pending_verification') => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-100';
      case 'suspended': return 'bg-red-100 text-red-700 dark:bg-red-700 dark:text-red-100';
      case 'pending_verification': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-600 dark:text-yellow-100';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-200';
    }
  };


  return (
    <>
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 text-gray-900 dark:text-gray-100">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Platform Analytics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">Total Users</h3>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-1">{users.length}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">Active Requests</h3>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">25</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">Completed Services</h3>
            <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-1">150</p>
          </div>
           <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">Flagged/Disputed Items</h3>
            <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-1">{flaggedRequests.length}</p>
          </div>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-200 flex items-center">
            <Icon path={ICON_PATHS.USERS} className="w-7 h-7 mr-2" /> User Management
        </h2>
        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Role</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions