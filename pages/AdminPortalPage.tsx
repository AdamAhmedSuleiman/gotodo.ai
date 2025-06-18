// src/pages/AdminPortalPage.tsx
import React, { useState, useEffect } from 'react';
import { AdminUserView, FlaggedRequestView, UserRole, RequestStatus, DisputeDetails, User, ServiceType } from '../types.js'; 
import Icon from '../components/ui/Icon.js';
import { ICON_PATHS } from '../constants.js';
import Button from '../components/ui/Button.js';
import LoadingSpinner from '../components/ui/LoadingSpinner.js';
import FlaggedRequestDetailsModal from '../components/admin/FlaggedRequestDetailsModal.js';
import AdminUserDetailsModal from '../components/admin/AdminUserDetailsModal.js'; 
import ContextualHelpPanel from '../components/ui/ContextualHelpPanel.js';
import { useToast } from '../contexts/ToastContext.js'; 
import { updateUserStatus, getAllUsers as fetchAllUsers } from '../services/authService.js'; 
import AnalyticsDashboard from '../components/admin/AnalyticsDashboard.js';
import SystemConfigPanel from '../components/admin/SystemConfigPanel.js';
import BroadcastMessagePanel from '../components/admin/BroadcastMessagePanel.js';


const initialMockUsers: AdminUserView[] = [
  { id: 'requester1', email: 'requester@example.com', name: 'John Doe', role: UserRole.REQUESTER, faceIdRegistered: true, avatarUrl: 'https://picsum.photos/seed/requester1/100/100', status: 'active', registrationDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(), lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), averageRating: 4.2 },
  { id: 'provider1', email: 'provider@example.com', name: 'Jane Smith', role: UserRole.PROVIDER, faceIdRegistered: true, avatarUrl: 'https://picsum.photos/seed/provider1/100/100', status: 'active', registrationDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(), lastLogin: new Date(Date.now() - 1000 * 60 * 30).toISOString(), averageRating: 4.8 },
  { id: 'admin1', email: 'admin@example.com', name: 'Admin User', role: UserRole.ADMIN, faceIdRegistered: false, avatarUrl: 'https://picsum.photos/seed/admin1/100/100', status: 'active', registrationDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 100).toISOString(), lastLogin: new Date().toISOString(), averageRating: 0 },
  { id: 'user_pending', email: 'pending@example.com', name: 'Pending User', role: UserRole.REQUESTER, faceIdRegistered: false, status: 'pending_verification', registrationDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), averageRating: 0 },
  { id: 'user_suspended', email: 'suspended@example.com', name: 'Suspended User', role: UserRole.PROVIDER, faceIdRegistered: true, status: 'suspended', registrationDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(), lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), averageRating: 2.5  },
];

const initialFlaggedRequests: FlaggedRequestView[] = [
  { id: 'flaggedreq1', requesterId: 'user_anon_1', requestFor: 'self', textInput: "Request with inappropriate language for 'item delivery'.", type: ServiceType.PRODUCT_SALE, creationDate: new Date(Date.now() - 1000 * 60 * 30).toISOString(), status: RequestStatus.MODERATION_REVIEW, flaggedBy: 'System', reason: 'Inappropriate language detected.', flagDate: new Date().toISOString(), moderationStatus: 'pending_review' },
  { id: 'flaggedreq2', requesterId: 'user_anon_2', requestFor: 'self', aiAnalysisSummary: "Suspicious ride request to an unusual location late at night.", type: ServiceType.RIDE_DELIVERY, creationDate: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), status: RequestStatus.MODERATION_REVIEW, flaggedBy: 'user_report_id_xyz', reason: 'User reported suspicious activity.', flagDate: new Date(Date.now() - 1000 * 60 * 5).toISOString(), moderationStatus: 'pending_review' },
  { 
    id: 'disputedreq1', 
    requesterId: 'requester1',
    requestFor: 'self',
    textInput: "Plumbing service was incomplete, and the provider was rude.", 
    type: ServiceType.PROFESSIONAL_SERVICE, 
    creationDate: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), 
    status: RequestStatus.DISPUTED, 
    providerId: 'provider1',
    assignedProviderName: 'Jane Smith',
    disputeDetails: {
        reason: "Service not as described",
        description: "The plumber only fixed half of the issues mentioned and was very dismissive when I pointed it out. The faucet is still leaking slightly.",
        reportedDate: new Date(Date.now() - 1000 * 60 * 15).toISOString()
    },
    flaggedBy: 'requester1', 
    reason: 'User Dispute: Service not as described',
    flagDate: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    moderationStatus: 'pending_review'
  }
];

type AdminTab = 'users' | 'content' | 'analytics' | 'config' | 'broadcast';


const AdminPortalPage: React.FC = () => {
  const [users, setUsers] = useState<AdminUserView[]>(initialMockUsers); // Use initial mock for now
  const [flaggedRequests, setFlaggedRequests] = useState<FlaggedRequestView[]>(initialFlaggedRequests);
  const [isLoading, setIsLoading] = useState(false); 
  const { addToast } = useToast();

  const [selectedFlaggedRequest, setSelectedFlaggedRequest] = useState<FlaggedRequestView | null>(null);
  const [isFlaggedRequestModalOpen, setIsFlaggedRequestModalOpen] = useState(false);

  const [selectedUser, setSelectedUser] = useState<AdminUserView | null>(null);
  const [isUserDetailsModalOpen, setIsUserDetailsModalOpen] = useState(false);
  
  const [isHelpPanelOpen, setIsHelpPanelOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>('analytics');

  // // Example: Fetch real users if API exists
  // useEffect(() => {
  //   const loadUsers = async () => {
  //     setIsLoading(true);
  //     try {
  //       const fetchedUsers = await fetchAllUsers(); // Assuming this function exists in authService
  //       setUsers(fetchedUsers.map(u => ({ ...u, averageRating: u.averageRating ?? 0 }))); // Ensure averageRating
  //     } catch (error) {
  //       addToast("Failed to load users.", "error");
  //       setUsers(initialMockUsers); // Fallback to mock
  //     } finally {
  //       setIsLoading(false);
  //     }
  //   };
  //   loadUsers();
  //   // Similarly load flagged requests
  // }, [addToast]);


  const openFlaggedRequestDetails = (request: FlaggedRequestView) => {
    setSelectedFlaggedRequest(request);
    setIsFlaggedRequestModalOpen(true);
  };
  
  const openUserDetails = (user: AdminUserView) => {
    setSelectedUser(user);
    setIsUserDetailsModalOpen(true);
  };

  const handleModerateRequest = async (
    requestId: string, 
    action: 'resolve' | 'warn_user' | 'ban_user' | 'remove_content' | 'dismiss_flag', 
    notes?: string
  ) => {
    addToast(`Action "${action.replace('_', ' ')}" taken for request ${requestId.substring(0,6)}. Notes: ${notes || 'N/A'} (Mock)`, 'success');
    const request = flaggedRequests.find(r => r.id === requestId);

    if (action === 'remove_content' || action === 'dismiss_flag' || action === 'resolve') {
      setFlaggedRequests(prev => prev.filter(r => r.id !== requestId));
    } else {
      setFlaggedRequests(prev => prev.map(r => r.id === requestId ? {...r, moderationStatus: 'resolved', moderationNotes: notes} : r));
    }

    if (action === 'ban_user' && request) {
      const userIdToBan = request.requesterId || (request.providerId as string); 
      if (userIdToBan) {
        await handleToggleUserStatus(userIdToBan, 'active', true); // Force suspend
      }
    }
    if (action === 'warn_user' && request) {
       addToast(`User ${request.requesterId || request.providerId} warned (mock).`, "warning");
    }
  };

  const handleToggleUserStatus = async (userId: string, currentStatus?: 'active' | 'suspended' | 'pending_verification', forceSuspend = false) => {
    let targetStatus: 'active' | 'suspended' | 'pending_verification' = 
      currentStatus === 'suspended' ? 'active' : 'suspended';
    if (forceSuspend) targetStatus = 'suspended';
    if (currentStatus === 'pending_verification' && !forceSuspend) targetStatus = 'active';
    
    try {
      const updatedUser = await updateUserStatus(userId, targetStatus);
      setUsers(prevUsers => prevUsers.map(u => u.id === userId ? { ...u, status: updatedUser.status as AdminUserView['status'] } : u));
      
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

  const tabs: { id: AdminTab, label: string, icon: keyof typeof ICON_PATHS }[] = [
    { id: 'analytics', label: 'Analytics', icon: 'CHART_BAR' },
    { id: 'users', label: 'Users', icon: 'USERS' },
    { id: 'content', label: 'Moderation', icon: 'FLAG' },
    { id: 'config', label: 'Configuration', icon: 'COG_6_TOOTH' },
    { id: 'broadcast', label: 'Broadcast', icon: 'SPEAKER_WAVE' },
  ];


  return (
    <>
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 text-gray-900 dark:text-gray-100">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-4 sm:space-x-6 overflow-x-auto" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm focus:outline-none flex items-center
                ${activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-300'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-500'}`}
              aria-current={activeTab === tab.id ? 'page' : undefined}
            >
              <Icon path={ICON_PATHS[tab.icon]} className="w-4 h-4 mr-1.5" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'analytics' && <AnalyticsDashboard />}
      
      {activeTab === 'users' && (
        <section>
            <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-200 flex items-center">User Management</h2>
            <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Role</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                            <img className="h-10 w-10 rounded-full object-cover" src={user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random&color=fff`} alt={user.name} />
                        </div>
                        <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.name}</div>
                        </div>
                        </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{user.role}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusChipClass(user.status)}`}>
                        {user.status?.replace('_',' ') || 'N/A'}
                        </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Button variant="ghost" size="sm" onClick={() => openUserDetails(user)} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                        View Details
                        </Button>
                    </td>
                    </tr>
                ))}
                </tbody>
            </table>
            </div>
        </section>
      )}

      {activeTab === 'content' && (
        <section>
            <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-200 flex items-center">Moderation Queue</h2>
            <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Request ID</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Reason</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Flagged By</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {flaggedRequests.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{request.id.substring(0,8)}...</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200 truncate max-w-xs" title={request.reason}>{request.reason}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{request.flaggedBy}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{new Date(request.flagDate || Date.now()).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusChipClass(request.moderationStatus as any || 'pending_review')}`}>
                        {request.moderationStatus?.replace('_',' ') || 'Pending Review'}
                        </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Button variant="ghost" size="sm" onClick={() => openFlaggedRequestDetails(request)} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                        Review
                        </Button>
                    </td>
                    </tr>
                ))}
                </tbody>
            </table>
            {flaggedRequests.length === 0 && <p className="text-center py-4 text-gray-500 dark:text-gray-400">No items in moderation queue.</p>}
            </div>
        </section>
      )}

      {activeTab === 'config' && (
        <section className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border dark:border-gray-700">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-200">System Configuration</h2>
            <SystemConfigPanel />
        </section>
      )}

      {activeTab === 'broadcast' && (
         <section className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border dark:border-gray-700">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Broadcast Message</h2>
            <BroadcastMessagePanel />
        </section>
      )}


      <Button
        onClick={() => setIsHelpPanelOpen(true)}
        variant="ghost"
        className="fixed bottom-6 right-6 p-3 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-offset-gray-900"
        aria-label="Help"
      >
        <Icon path={ICON_PATHS.QUESTION_MARK_CIRCLE} className="w-6 h-6" />
      </Button>
      <ContextualHelpPanel 
        isOpen={isHelpPanelOpen}
        onClose={() => setIsHelpPanelOpen(false)}
        pageKey="admin-portal"
      />
      <FlaggedRequestDetailsModal
        isOpen={isFlaggedRequestModalOpen}
        onClose={() => setIsFlaggedRequestModalOpen(false)}
        request={selectedFlaggedRequest}
        onModerateRequest={handleModerateRequest}
      />
      <AdminUserDetailsModal
        isOpen={isUserDetailsModalOpen}
        onClose={() => setIsUserDetailsModalOpen(false)}
        user={selectedUser}
        onToggleUserStatus={handleToggleUserStatus}
      />
    </div>
    </>
  );
};

export default AdminPortalPage;