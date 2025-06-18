// src/pages/ProviderPortalPage.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import EarningsChart from '../components/dashboard/EarningsChart.js';
import { 
    EarningDataPoint, RequestData, ServiceType, ProfessionalService, Review, Product, Vehicle, 
    RequestStatus, ProviderAvailabilitySlot, TransportationMode, GeoLocation, User, ChatMessage, 
    RequesterRating, ProviderDocument, DocumentStatus, PayoutAccount, PayoutHistoryEntry, HeatmapTile,
    DailyRoutineRoute, HunterModeSettings, MockProviderBid, BlockedTimeSlot
} from '../types.js';
import Icon from '../components/ui/Icon.js';
import { ICON_PATHS } from '../constants.js';
import Button from '../components/ui/Button.js';
import LoadingSpinner from '../components/ui/LoadingSpinner.js';
import { getEarningsInsights, optimizeActiveTaskRouteAI } from '../services/geminiService.js';
import * as taskService from '../services/taskService.js'; 
import * as userDataService from '../services/userDataService.js'; 
import * as providerService from '../services/providerService.js'; 
import ManageServicesModal from '../components/provider/ManageServicesModal.js';
import ManageProductsModal from '../components/provider/ManageProductsModal.js';
import ManageVehiclesModal from '../components/provider/ManageVehiclesModal.js';
import ManageAvailabilityModal from '../components/provider/ManageAvailabilityModal.js';
import ProviderEarningsHistoryModal from '../components/provider/ProviderEarningsHistoryModal.js';
import RateRequesterModal from '../components/provider/RateRequesterModal.js';
import ChatModal from '../components/shared/ChatModal.js';
// import MapDisplay from '../components/map/MapDisplay.js'; // Not actively used on this page for provider currently
import StarRating from '../components/ui/StarRating.js';
import ContextualHelpPanel from '../components/ui/ContextualHelpPanel.js';
import HeatmapPlaceholder, { generateMockHeatmapTiles } from '../components/provider/HeatmapPlaceholder.js';
import ManageDocumentsModal from '../components/provider/ManageDocumentsModal.js';
import PayoutSettingsModal from '../components/provider/PayoutSettingsModal.js'; 
import SetWorkDestinationModal from '../components/provider/SetWorkDestinationModal.js'; 
import ManageDailyRoutesModal from '../components/provider/ManageDailyRoutesModal.js';
import ProductScanModal from '../components/provider/ProductScanModal.js'; 
import HunterModeSettingsModal from '../components/provider/HunterModeSettingsModal.js';
import MakeOfferModal from '../components/provider/MakeOfferModal.js'; 
import { useAuth } from '../contexts/AuthContext.js';
import { useToast } from '../contexts/ToastContext.js';
import { useNotifications } from '../contexts/NotificationContext.js'; 

import OnboardingTour from '../components/ui/OnboardingTour.js';

const mockEarningsData: EarningDataPoint[] = [ { date: 'Mon', earnings: 120 }, { date: 'Tue', earnings: 180 }, { date: 'Wed', earnings: 90 }, { date: 'Thu', earnings: 210 }, { date: 'Fri', earnings: 150 }, { date: 'Sat', earnings: 300 }, { date: 'Sun', earnings: 250 },];
const mockIncomingRequestsSpecificToProvider: RequestData[] = [ 
    { id: 'req-prov-3', requesterId: 'requester_user_id_3', type: ServiceType.PRODUCT_SALE, textInput: "Requesting a custom cake for birthday", creationDate: new Date(Date.now() - 1000 * 60 * 60).toISOString(), suggestedPrice: 50, status: RequestStatus.AWAITING_ACCEPTANCE, providerId: 'provider1' , origin: {lat:37.7500,lng:-122.4250, address:"Client Address, SF"}, requestFor: 'self' },
];
const mockProviderReviews: Review[] = [ { rating: 5, text: "Amazing job!", date: "2024-05-20", reviewerName: "Alice B." },];

const daysOfWeek: ProviderAvailabilitySlot['day'][] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const initialAvailability: ProviderAvailabilitySlot[] = daysOfWeek.map(day => ({
  day,
  isAvailable: !['Saturday', 'Sunday'].includes(day),
  slots: !['Saturday', 'Sunday'].includes(day) ? [{ startTime: '09:00', endTime: '17:00' }] : []
}));


const mockHeatmapData = generateMockHeatmapTiles(10, 15);

const onboardingStepsProvider = [ { elementQuerySelector: '.provider-dashboard-main', title: 'Provider Dashboard', content: 'Manage services, earnings, and requests.', position: 'center' as const }, { elementQuerySelector: '.earnings-section', title: 'Track Earnings', content: 'Monitor earnings and get AI insights.', position: 'bottom'as const }, { elementQuerySelector: '.assigned-tasks-section', title: 'Assigned Tasks', content: 'Track, update status, use navigation & chat.', position: 'top'as const }, { elementQuerySelector: '.manage-profile-section', title: 'Profile & Settings', content: 'Manage your services, documents, and payout methods here.', position: 'left'as const }, { elementQuerySelector: '.heatmap-section', title: 'Demand Heatmap', content: 'Check this mock heatmap for areas with high service demand.', position: 'bottom' as const},];

const useSaveToLocalStorage = ( keySuffix: string, data: any, user: User | null, isProfileLoading: boolean, getLocalStorageKey: (itemType: string) => string | null ): void => { useEffect(() => { if (!user || isProfileLoading || !getLocalStorageKey) return; const key = getLocalStorageKey(keySuffix); if (key) { localStorage.setItem(key, JSON.stringify(data)); } }, [data, user, keySuffix, getLocalStorageKey, isProfileLoading]); };
const formatStatusText = (status: RequestStatus) => status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());


const ProviderPortalPage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { addToast } = useToast();
  const { addNotification } = useNotifications(); 
  
  const [earnings, setEarnings] = useState<EarningDataPoint[]>(mockEarningsData);
  const [insights, setInsights] = useState<string[]>([]);
  const [insightsError, setInsightsError] = useState<string | null>(null);
  const [allRequests, setAllRequests] = useState<RequestData[]>(() => { const storedTasks = localStorage.getItem(`gotodo_provider_tasks_${user?.id || 'default'}`); return storedTasks ? JSON.parse(storedTasks) : mockIncomingRequestsSpecificToProvider.sort((a,b) => new Date(b.creationDate).getTime() - new Date(a.creationDate).getTime()); });
  const [isLoading, setIsLoading] = useState(true);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);

  const [myServices, setMyServices] = useState<ProfessionalService[]>([]);
  const [myProducts, setMyProducts] = useState<Product[]>([]);
  const [myVehicles, setMyVehicles] = useState<Vehicle[]>([]);
  const [myAvailability, setMyAvailability] = useState<ProviderAvailabilitySlot[]>(initialAvailability);
  const [myBlockedTimeSlots, setMyBlockedTimeSlots] = useState<BlockedTimeSlot[]>([]);
  const [myDocuments, setMyDocuments] = useState<ProviderDocument[]>([]);
  const [myPayoutAccounts, setMyPayoutAccounts] = useState<PayoutAccount[]>([]);
  const [myPayoutHistory, setMyPayoutHistory] = useState<PayoutHistoryEntry[]>([]);
  const [myMockBalance, setMyMockBalance] = useState<number>(250.75);
  const [workDestination, setWorkDestination] = useState<GeoLocation | null>(null); 
  const [myDailyRoutes, setMyDailyRoutes] = useState<DailyRoutineRoute[]>([]);
  const [hunterModeSettings, setHunterModeSettings] = useState<HunterModeSettings>({ isEnabled: false, maxDistanceKm: 20, preferredServiceTypes: [] });
  const [huntedRequests, setHuntedRequests] = useState<RequestData[]>([]);
  const [isFindingHuntedRequests, setIsFindingHuntedRequests] = useState(false);
  const [requestToMakeOfferOn, setRequestToMakeOfferOn] = useState<RequestData | null>(null);
  const [isMakeOfferModalOpen, setIsMakeOfferModalOpen] = useState(false);
  const [optimizedTaskRouteSuggestion, setOptimizedTaskRouteSuggestion] = useState<string | null>(null);
  const [isOptimizingTaskRoute, setIsOptimizingTaskRoute] = useState(false);


  const [isManageServicesModalOpen, setIsManageServicesModalOpen] = useState(false);
  const [isManageProductsModalOpen, setIsManageProductsModalOpen] = useState(false);
  const [isProductScanModalOpen, setIsProductScanModalOpen] = useState(false);
  const [isManageVehiclesModalOpen, setIsManageVehiclesModalOpen] = useState(false);
  const [isManageAvailabilityModalOpen, setIsManageAvailabilityModalOpen] = useState(false);
  const [isManageDocumentsModalOpen, setIsManageDocumentsModalOpen] = useState(false);
  const [isPayoutSettingsModalOpen, setIsPayoutSettingsModalOpen] = useState(false);
  const [isSetWorkDestinationModalOpen, setIsSetWorkDestinationModalOpen] = useState(false); 
  const [isManageDailyRoutesModalOpen, setIsManageDailyRoutesModalOpen] = useState(false);
  const [isHunterModeSettingsModalOpen, setIsHunterModeSettingsModalOpen] = useState(false);
  
  const [isEarningsHistoryModalOpen, setIsEarningsHistoryModalOpen] = useState(false);
  const [isRateRequesterModalOpen, setIsRateRequesterModalOpen] = useState(false);
  const [taskToRateRequesterFor, setTaskToRateRequesterFor] = useState<RequestData | null>(null);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [currentChatRequest, setCurrentChatRequest] = useState<RequestData | null>(null);

  const [providerReviews, setProviderReviews] = useState<Review[]>(mockProviderReviews);
  const averageRating = providerReviews.length > 0 ? providerReviews.reduce((acc, review) => acc + review.rating, 0) / providerReviews.length : 0;
  const [isHelpPanelOpen, setIsHelpPanelOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(() => !localStorage.getItem('onboardingTourShown_provider_v3'));
  const locationIntervalRef = useRef<number | null>(null);
  const simulatedNotificationTimeouts = useRef<number[]>([]);

  const completedTasksForHistory = allRequests.filter(r => r.status === RequestStatus.COMPLETED && r.providerId === user?.id);
  const totalEarnedFromTasks = completedTasksForHistory.reduce((sum, task) => sum + (task.earnedAmount || 0), 0);
  const totalPaidOutAmount = myPayoutHistory.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);

  useEffect(() => { return () => { simulatedNotificationTimeouts.current.forEach(clearTimeout); }; }, []);

  const getLocalStorageKey = useCallback((itemType: string) => { if (!user) return null; return `gotodo_provider_${user.id}_${itemType}`; }, [user]);
  useEffect(() => { localStorage.setItem(`gotodo_provider_tasks_${user?.id || 'default'}`, JSON.stringify(allRequests)); }, [allRequests, user?.id]);

  useEffect(() => {
    const loadAllData = async () => {
        setIsProfileLoading(true);
        if (!user) { setIsProfileLoading(false); return; }

        const loadItem = async (keySuffix: string, setter: Function, defaultValue?: any, isAsync = false) => {
            const key = getLocalStorageKey(keySuffix);
            if (key) {
                if (isAsync) {
                    try {
                        const serviceFunctionName = `get${keySuffix.charAt(0).toUpperCase() + keySuffix.slice(1).replace(/_/g, '')}`;
                        if (typeof (userDataService as any)[serviceFunctionName] === 'function') {
                            const data = await (userDataService as any)[serviceFunctionName](user.id);
                            setter(data || defaultValue);
                        } else {
                             console.warn(`userDataService function ${serviceFunctionName} not found for ${keySuffix}. Using localStorage/default.`);
                             const storedData = localStorage.getItem(key);
                             if (storedData) setter(JSON.parse(storedData));
                             else if (defaultValue !== undefined) setter(defaultValue);
                        }
                    } catch (e) {
                        console.warn(`Failed to load ${keySuffix} from API, using localStorage/default. Error:`, e);
                        const storedData = localStorage.getItem(key);
                        if (storedData) setter(JSON.parse(storedData));
                        else if (defaultValue !== undefined) setter(defaultValue);
                    }
                } else {
                    const storedData = localStorage.getItem(key);
                    if (storedData) setter(JSON.parse(storedData));
                    else if (defaultValue !== undefined) setter(defaultValue);
                }
            } else if (defaultValue !== undefined) {
                setter(defaultValue);
            }
        };

        await Promise.all([
            loadItem('services', setMyServices, []), 
            loadItem('products', setMyProducts, []), 
            loadItem('vehicles', setMyVehicles, []), 
            loadItem('availabilitySlots', setMyAvailability, initialAvailability, true), 
            loadItem('blockedTimeSlots', setMyBlockedTimeSlots, [], true),
            loadItem('documents', setMyDocuments, []), 
            loadItem('payoutAccounts', setMyPayoutAccounts, [], true), 
            loadItem('payoutHistory', setMyPayoutHistory, [], true), 
            loadItem('mockBalance', setMyMockBalance, 250.75), // Not async
            loadItem('dailyRoutineRoutes', setMyDailyRoutes, [], true), 
        ]);
        
        try {
            const dest = await userDataService.getProviderWorkDestination(user.id);
            setWorkDestination(dest);
        } catch (e) { console.warn("Failed to load work destination from API.", e); }

        try {
            const loadedHunterSettings = await userDataService.getHunterModeSettings(user.id);
             setHunterModeSettings(loadedHunterSettings || { isEnabled: false, maxDistanceKm: 20, preferredServiceTypes: [], minRequestPrice: undefined, minRequesterRating: undefined, keywords: undefined });
        } catch (e) { 
            console.warn("Failed to load hunter settings from API.", e);
            setHunterModeSettings({ isEnabled: false, maxDistanceKm: 20, preferredServiceTypes: [], minRequestPrice: undefined, minRequesterRating: undefined, keywords: undefined });
        }

        setIsProfileLoading(false);
    };
    loadAllData();
  }, [user, getLocalStorageKey]);

  useSaveToLocalStorage('services', myServices, user, isProfileLoading, getLocalStorageKey);
  useSaveToLocalStorage('products', myProducts, user, isProfileLoading, getLocalStorageKey);
  useSaveToLocalStorage('vehicles', myVehicles, user, isProfileLoading, getLocalStorageKey);
  useSaveToLocalStorage('availability_slots', myAvailability, user, isProfileLoading, getLocalStorageKey);
  useSaveToLocalStorage('blocked_time_slots', myBlockedTimeSlots, user, isProfileLoading, getLocalStorageKey);
  useSaveToLocalStorage('documents', myDocuments, user, isProfileLoading, getLocalStorageKey);
  useSaveToLocalStorage('payout_accounts', myPayoutAccounts, user, isProfileLoading, getLocalStorageKey);
  useSaveToLocalStorage('payout_history', myPayoutHistory, user, isProfileLoading, getLocalStorageKey);
  useSaveToLocalStorage('mock_balance', myMockBalance, user, isProfileLoading, getLocalStorageKey);
  useSaveToLocalStorage('daily_routes', myDailyRoutes, user, isProfileLoading, getLocalStorageKey);
  useSaveToLocalStorage('hunter_mode_settings', hunterModeSettings, user, isProfileLoading, getLocalStorageKey);


  const findAndDisplayHuntedRequests = useCallback(async () => { if (!user || !isOnline || !hunterModeSettings.isEnabled) { setHuntedRequests([]); return; } setIsFindingHuntedRequests(true); try { const mockProviderLocation: GeoLocation = user.workDestination || (user.location || { lat: 37.7749, lng: -122.4194, address: "Provider's Current Mock Location" }); const found = await providerService.findNearbyRequests(mockProviderLocation, hunterModeSettings); setHuntedRequests(found.map(r => ({ ...r, isHuntedRequest: true }))); if(found.length > 0) { addToast(`${found.length} nearby opportunities found via Hunter Mode.`, 'info'); const hunterNotifTimeout = window.setTimeout(() => { addNotification(`Hunter Mode: New opportunity - "${found[0].textInput?.substring(0,25)}..."`, 'new_request', `/provider-portal?requestId=${found[0].id}`, found[0].id); }, 5000); simulatedNotificationTimeouts.current.push(hunterNotifTimeout as unknown as number); }} catch (error) { addToast('Error finding hunted requests.', 'error'); console.error("Error in findAndDisplayHuntedRequests:", error); } finally { setIsFindingHuntedRequests(false); }}, [user, isOnline, hunterModeSettings, addToast, addNotification]); 
  useEffect(() => { if (hunterModeSettings.isEnabled && isOnline) { findAndDisplayHuntedRequests(); const intervalId = setInterval(findAndDisplayHuntedRequests, 60000); return () => clearInterval(intervalId); } else { setHuntedRequests([]); }}, [hunterModeSettings.isEnabled, isOnline, findAndDisplayHuntedRequests]);
  const handleToggleHunterMode = () => { if (!user) return; const newIsEnabled = !hunterModeSettings.isEnabled; const newSettings = { ...hunterModeSettings, isEnabled: newIsEnabled }; setHunterModeSettings(newSettings); userDataService.saveHunterModeSettings(user.id, newSettings); addToast(`Hunter Mode ${newIsEnabled ? 'Enabled' : 'Disabled'}.`, 'info'); if (!newIsEnabled) setHuntedRequests([]); };
  const handleSaveHunterSettings = (settings: HunterModeSettings) => { if (!user) return; setHunterModeSettings(settings); userDataService.saveHunterModeSettings(user.id, settings); addToast('Hunter Mode settings saved!', 'success'); setIsHunterModeSettingsModalOpen(false); };
  useEffect(() => { const fetchData = async () => { setIsLoading(true); setEarnings(mockEarningsData); try { setInsightsError(null); const aiInsights = await getEarningsInsights(mockEarningsData); setInsights(aiInsights); } catch (error) { console.error("Failed to fetch AI earnings insights:", error); setInsightsError((error as Error).message || "Could not load AI insights."); setInsights([]); } finally { setIsLoading(false); }}; if (user) fetchData(); else setIsLoading(false); }, [user]);
  const combinedIncomingRequests = [ ...huntedRequests, ...allRequests.filter(r => (r.status === RequestStatus.AWAITING_ACCEPTANCE && r.providerId === user?.id) && !huntedRequests.find(hr => hr.id === r.id)) ].sort((a,b) => new Date(b.creationDate).getTime() - new Date(a.creationDate).getTime());
  const assignedTasks = allRequests.filter(r => r.providerId === user?.id && r.status !== RequestStatus.PENDING && r.status !== RequestStatus.AWAITING_ACCEPTANCE && r.status !== RequestStatus.COMPLETED && r.status !== RequestStatus.CANCELLED && r.status !== RequestStatus.DISPUTED);
  
  const updateRequestStatus = async (requestId: string, newStatus: RequestStatus, updates: Partial<RequestData> = {}) => { 
    const requestToUpdate = await taskService.updateRequestInPublicPool({ id: requestId, status: newStatus, providerId: user?.id, assignedProviderName: user?.name || updates.assignedProviderName, ...updates } as RequestData); 
    setAllRequests(prev => prev.map(r => r.id === requestId ? requestToUpdate : r ).sort((a,b) => new Date(b.creationDate).getTime() - new Date(a.creationDate).getTime())); 
  };
  const handleAcceptRequest = (requestId: string) => { updateRequestStatus(requestId, RequestStatus.PROVIDER_ASSIGNED, { isHuntedRequest: false }); addToast(`Request accepted. It's now in 'My Assigned Tasks'.`, 'success'); addNotification("You accepted a new task!", "task_update", `/provider-portal?taskId=${requestId}`, requestId); setHuntedRequests(prev => prev.filter(hr => hr.id !== requestId)); };
  const handleRejectRequest = async (requestId: string) => { const rejectedRequest = allRequests.find(r => r.id === requestId) || huntedRequests.find(r => r.id === requestId); if (rejectedRequest && rejectedRequest.status === RequestStatus.AWAITING_ACCEPTANCE && rejectedRequest.providerId === user?.id) { await taskService.updateRequestInPublicPool({...rejectedRequest, status: RequestStatus.PENDING, providerId: undefined, assignedProviderName: undefined, bids: []}); } setAllRequests(prev => prev.filter(r => r.id !== requestId)); addToast(`Request rejected.`, 'info'); setHuntedRequests(prev => prev.filter(hr => hr.id !== requestId)); };
  const handleOpenMakeOfferModal = (request: RequestData) => { setRequestToMakeOfferOn(request); setIsMakeOfferModalOpen(true); };
  const handleSubmitOffer = async (requestId: string, offerAmount: number, message: string) => { if (!user) return; const requestToUpdate = await taskService.getRequestFromPublicPool(requestId); if (requestToUpdate) { const newBid: MockProviderBid = { providerId: user.id, providerName: user.name, providerAvatarUrl: user.avatarUrl, bidAmount: offerAmount, message, timestamp: new Date().toISOString(), }; const updatedBids = [...(requestToUpdate.bids || []), newBid]; const finalUpdates: RequestData = { ...requestToUpdate, bids: updatedBids, status: RequestStatus.AWAITING_ACCEPTANCE, isHuntedRequest: false, providerId: user.id, assignedProviderName: user.name }; await taskService.updateRequestInPublicPool(finalUpdates); setHuntedRequests(prev => prev.filter(hr => hr.id !== requestId)); addToast(`Offer of $${offerAmount.toFixed(2)} submitted for request!`, 'success'); addNotification(`New offer received for request ${requestId.substring(0,6)}`, 'bid_received', `/requester-portal?requestId=${requestId}`, requestId); } else { addToast('Error: Could not find the request to submit offer.', 'error'); } setIsMakeOfferModalOpen(false); setRequestToMakeOfferOn(null); };
  const handleStartSharingLocation = async (task: RequestData) => { if (!task.origin || !task.destination) { addToast("Task origin or destination missing.", "warning"); return; } addToast(`Simulating location sharing for task ${task.id}.`, "info"); let progress = 0; if (locationIntervalRef.current) clearInterval(locationIntervalRef.current); locationIntervalRef.current = window.setInterval(async () => { progress += 0.1; if (progress > 1) { progress = 1; if (locationIntervalRef.current) clearInterval(locationIntervalRef.current); await taskService.clearMockProviderLocation(task.id!); addToast(`You have "arrived" at the destination for task ${task.id}.`, "success");} const currentLocation: GeoLocation = { lat: task.origin!.lat + (task.destination!.lat - task.origin!.lat) * progress, lng: task.origin!.lng + (task.destination!.lng - task.origin!.lng) * progress, address: `En route (progress: ${(progress * 100).toFixed(0)}%)`}; await taskService.saveMockProviderLocation(task.id!, currentLocation); setAllRequests(prev => prev.map(r => r.id === task.id ? {...r, providerLastLocation: currentLocation} : r)); }, 3000); };
  const handleStopSharingLocation = async (taskId: string) => { if (locationIntervalRef.current) { clearInterval(locationIntervalRef.current); locationIntervalRef.current = null; } await taskService.clearMockProviderLocation(taskId); setAllRequests(prev => prev.map(r => r.id === taskId ? {...r, providerLastLocation: null} : r)); addToast(`Location sharing stopped for task ${taskId}.`, "info"); };
  const handleTaskAction = async (task: RequestData, actionType?: 'start_trip' | 'end_trip') => { const { id: requestId, status: currentStatus, type: serviceType } = task; let nextStatus: RequestStatus = currentStatus; if(actionType === 'start_trip' && serviceType === ServiceType.RIDE_DELIVERY && currentStatus === RequestStatus.EN_ROUTE) { nextStatus = RequestStatus.SERVICE_IN_PROGRESS; addToast(`Trip started for task ${requestId}.`, 'success'); } else if (actionType === 'end_trip' && serviceType === ServiceType.RIDE_DELIVERY && currentStatus === RequestStatus.SERVICE_IN_PROGRESS) { nextStatus = RequestStatus.PENDING_PAYMENT; addToast(`Trip ended for task ${requestId}. Awaiting payment.`, 'success'); } else { if (currentStatus === RequestStatus.AWAITING_ACCEPTANCE) nextStatus = RequestStatus.PROVIDER_ASSIGNED; else if (currentStatus === RequestStatus.PROVIDER_ASSIGNED) nextStatus = RequestStatus.EN_ROUTE; else if (currentStatus === RequestStatus.EN_ROUTE) nextStatus = RequestStatus.SERVICE_IN_PROGRESS; else if (currentStatus === RequestStatus.SERVICE_IN_PROGRESS) nextStatus = RequestStatus.PENDING_PAYMENT; addToast(`Task ${requestId} status updated to ${formatStatusText(nextStatus)}`, 'success'); } const updates: Partial<RequestData> = {}; if (nextStatus === RequestStatus.PENDING_PAYMENT) { updates.earnedAmount = taskService.recordEarnedAmount(task); await handleStopSharingLocation(requestId); setMyMockBalance(prev => prev + (updates.earnedAmount || 0)); addNotification(`Task ${requestId.substring(0,6)} completed. Payment of $${updates.earnedAmount?.toFixed(2)} is pending.`, "payment_update", `/provider-portal?taskId=${requestId}`, requestId);} await updateRequestStatus(requestId, nextStatus, updates); if (nextStatus === RequestStatus.PENDING_PAYMENT) { const paymentTimeout = window.setTimeout(async () => { await updateRequestStatus(requestId, RequestStatus.COMPLETED, {completionDate: new Date().toISOString()}); addToast(`Payment received for task ${requestId}. Task Completed.`, 'success'); addNotification(`Payment of $${updates.earnedAmount?.toFixed(2)} received for task ${requestId.substring(0,6)}.`, "payment_update", `/provider-portal?taskId=${requestId}`, requestId); const completedTask = allRequests.find(r => r.id === requestId); if(completedTask) setTaskToRateRequesterFor(completedTask);}, 5000); simulatedNotificationTimeouts.current.push(paymentTimeout as unknown as number); }};
  const handleRateRequesterSubmit = async (rating: number, comment?: string) => { if (!taskToRateRequesterFor || !user) return; if (!taskToRateRequesterFor.requesterId) { addToast("Error: Requester ID missing.", "error"); setIsRateRequesterModalOpen(false); setTaskToRateRequesterFor(null); return; } const newRating: RequesterRating = { rating, comment, date: new Date().toISOString(), providerId: user.id, providerName: user.name, }; await taskService.saveRequesterRating(taskToRateRequesterFor.requesterId, newRating); addToast(`You rated requester for task ${taskToRateRequesterFor.id}.`, "success"); setIsRateRequesterModalOpen(false); setTaskToRateRequesterFor(null); };
  const handleOpenChat = async (request: RequestData) => { const msgs = await taskService.getChatMessages(request.id); setCurrentChatRequest({...request, chatMessages: msgs}); setIsChatModalOpen(true); };
  const handleSendMessage = async (requestId: string, message: ChatMessage) => { await taskService.addChatMessage(requestId, message); const updatedMessages = await taskService.getChatMessages(requestId); setAllRequests(prev => prev.map(r => r.id === requestId ? {...r, chatMessages: updatedMessages} : r)); addToast("Message sent!", "info"); };
  const getActionForStatus = (task: RequestData): { text: string; icon: string; actionType?: 'start_trip' | 'end_trip' } | null => { const { status, type } = task; if (status === RequestStatus.AWAITING_ACCEPTANCE) return { text: "Accept Task", icon: ICON_PATHS.CHECK_CIRCLE }; if (status === RequestStatus.PROVIDER_ASSIGNED) return { text: "Go En Route", icon: ICON_PATHS.PAPER_AIRPLANE }; if (status === RequestStatus.EN_ROUTE) { return type === ServiceType.RIDE_DELIVERY ? { text: "Start Trip", icon: ICON_PATHS.PLAY_CIRCLE, actionType: 'start_trip' } : { text: "Start Service", icon: ICON_PATHS.WRENCH }; } if (status === RequestStatus.SERVICE_IN_PROGRESS) { return type === ServiceType.RIDE_DELIVERY ? { text: "End Trip & Request Payment", icon: ICON_PATHS.CHECK_CIRCLE, actionType: 'end_trip' } : { text: "Mark Completed", icon: ICON_PATHS.CHECK_CIRCLE }; } return null; };
  const handleNavigation = (task: RequestData) => { let locationToNavigate: GeoLocation | undefined; let navType: 'origin' | 'destination' = 'origin'; if (task.status === RequestStatus.PROVIDER_ASSIGNED || (task.status === RequestStatus.EN_ROUTE && !task.providerLastLocation)) { locationToNavigate = task.origin; navType = 'origin'; } else if ((task.status === RequestStatus.EN_ROUTE && task.providerLastLocation) || task.status === RequestStatus.SERVICE_IN_PROGRESS) { locationToNavigate = task.destination; navType = 'destination'; } if (locationToNavigate && typeof locationToNavigate.lat === 'number' && typeof locationToNavigate.lng === 'number') { const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${locationToNavigate.lat},${locationToNavigate.lng}`; window.open(googleMapsUrl, '_blank'); addToast(`Opening navigation to task ${navType}.`, "info"); } else { addToast(`Location for task ${navType} is not available.`, "warning"); }};
  const handleAddService = (service: Omit<ProfessionalService, 'id' | 'providerId'>) => { if (!user) { addToast("You must be logged in.", "error"); return; } const newService: ProfessionalService = { ...service, id: `service-${Date.now()}`, providerId: user.id }; setMyServices(prev => [...prev, newService]); addToast("New service added!", "success");};
  const handleUpdateService = (service: ProfessionalService) => { setMyServices(prev => prev.map(s => s.id === service.id ? service : s)); addToast("Service updated!", "success");};
  const handleDeleteService = (serviceId: string) => { setMyServices(prev => prev.filter(s => s.id !== serviceId)); addToast("Service deleted.", "info");};
  const handleAddProduct = (product: Omit<Product, 'id'|'providerId'>) => { if(!user){addToast("Must be logged in.", "error"); return;} const newProduct: Product = {...product, id:`prod-${Date.now()}`, providerId: user.id}; setMyProducts(prev => [...prev, newProduct]); addToast("Product added!", "success");};
  const handleAddVehicle = (vehicle: Omit<Vehicle, 'id'|'providerId'>) => { if(!user){addToast("Must be logged in.", "error"); return;} const newVehicle: Vehicle = {...vehicle, id:`veh-${Date.now()}`, providerId: user.id}; setMyVehicles(prev => [...prev, newVehicle]); addToast("Vehicle added!", "success");};
  const handleSaveAvailability = async (availability: ProviderAvailabilitySlot[]) => { if (!user) return; await userDataService.saveProviderAvailabilitySlots(user.id, availability); setMyAvailability(availability); addToast("Availability updated!", "success");};
  const handleAddBlockedTimeSlot = async (slotData: Omit<BlockedTimeSlot, 'id'>) => { if (!user) return; const newSlot = await userDataService.addProviderBlockedTimeSlot(user.id, slotData); setMyBlockedTimeSlots(prev => [...prev, newSlot]); addToast("Time slot blocked.", "success"); };
  const handleDeleteBlockedTimeSlot = async (slotId: string) => { if (!user) return; await userDataService.deleteProviderBlockedTimeSlot(user.id, slotId); setMyBlockedTimeSlots(prev => prev.filter(s => s.id !== slotId)); addToast("Blocked time slot removed.", "info"); };
  const handleAddDocument = (documentData: Omit<ProviderDocument, 'id' | 'status' | 'uploadedAt' | 'verifiedAt'>, file: File) => { if(!user){addToast("Must be logged in.","error");return;} const newDocument: ProviderDocument = {...documentData, id:`doc-${Date.now()}`, status: 'pending_review', uploadedAt: new Date().toISOString(), fileUrl: URL.createObjectURL(file) /* Mock URL */}; setMyDocuments(prev => [...prev, newDocument]); addToast(`Document "${file.name}" uploaded for review.`, "success");};
  const handleDeleteDocument = (documentId: string) => { setMyDocuments(prev => prev.filter(d => d.id !== documentId)); addToast("Document deleted.", "info");};
  const handleAddPayoutAccount = async (accountData: Omit<PayoutAccount, 'id'|'addedAt'|'isPrimary'>) => {if(!user){addToast("Must be logged in.","error");return;} const newAccount = await userDataService.addPayoutAccount(user.id, {...accountData, isPrimary: myPayoutAccounts.length === 0}); setMyPayoutAccounts(prev => [...prev, newAccount]); addToast("Payout account added.", "success");};
  const handleSetPrimaryPayoutAccount = async (accountId: string) => {if(!user) return; await userDataService.setPrimaryPayoutAccount(user.id, accountId); setMyPayoutAccounts(prev => prev.map(acc => ({...acc, isPrimary: acc.id === accountId}))); addToast("Primary payout account updated.", "success");};
  const handleDeletePayoutAccount = async (accountId: string) => { if(!user) return; if(myPayoutAccounts.find(acc => acc.id === accountId && acc.isPrimary) && myPayoutAccounts.length > 1) {addToast("Cannot delete primary account if others exist.", "error"); return;} await userDataService.deletePayoutAccount(user.id, accountId); setMyPayoutAccounts(prev => prev.filter(acc => acc.id !== accountId)); addToast("Payout account deleted.", "info");};
  const handleRequestPayout = async (amount: number, accountId: string) => { if(!user){addToast("Must be logged in.","error");return;} const account = myPayoutAccounts.find(a => a.id === accountId); if(!account) {addToast("Payout account not found.", "error"); return;} const newEntry = await userDataService.requestPayout(user.id, amount, accountId); setMyPayoutHistory(prev => [newEntry, ...prev]); setMyMockBalance(prev => prev - amount); addToast(`Payout of $${amount.toFixed(2)} requested to ${newEntry.destination}.`, "success");};
  const handleSetWorkDestination = async (address: string) => { if(!user) { addToast("User not found.", "error"); return; } if (!address) { await userDataService.saveProviderWorkDestination(user.id, null); setWorkDestination(null); addToast("Work destination cleared.", "info"); return; } const newDestination: GeoLocation = userDataService.createGeoLocationFromString(address); await userDataService.saveProviderWorkDestination(user.id, newDestination); setWorkDestination(newDestination); addToast("Work destination set!", "success");};
  const handleSaveRoute = async (route: DailyRoutineRoute) => { 
    if(!user) return; 
    const savedRoute = await userDataService.saveDailyRoutineRoute(user.id, route); 
    setMyDailyRoutes(prev => {
        const routeExists = prev.some(r => r.id === savedRoute.id);
        if (routeExists) {
            return prev.map(r => r.id === savedRoute.id ? savedRoute : r);
        } else {
            return [...prev, savedRoute];
        }
    });
    addToast("Route saved!", "success"); 
  };
  const handleDeleteRoute = async (routeId: string) => { if (!user) return; await userDataService.deleteDailyRoutineRoute(user.id, routeId); setMyDailyRoutes(prev => prev.filter(r => r.id !== routeId)); addToast("Route deleted.", "info"); };
  const handleOpenScanModal = () => setIsProductScanModalOpen(true);
  const handleProductDetailsFromScan = (details: Partial<Product>) => { setMyProducts(prev => [...prev, { ...details, id:`prod-scan-${Date.now()}`, providerId: user!.id, photos: details.photos || [], stock: details.stock || 0, price: details.price || 0, name: details.name || "Scanned Product", description: details.description || "Details from scan." } as Product]); setIsProductScanModalOpen(false); addToast("Product details added from scan/image!", "success"); };
  const handleOptimizeActiveRoute = async () => { if (assignedTasks.length < 2) { addToast("Need at least 2 assigned tasks to optimize route.", "warning"); return; } setIsOptimizingTaskRoute(true); try { const providerLoc = user?.workDestination || (user?.location || undefined); const result = await optimizeActiveTaskRouteAI(assignedTasks, providerLoc); const reorderedTasks = result.orderedTaskIds.map(id => assignedTasks.find(t => t.id === id)).filter(Boolean) as RequestData[]; setAllRequests(prev => [...reorderedTasks, ...prev.filter(p => !assignedTasks.find(at => at.id === p.id))].sort((a,b) => new Date(b.creationDate).getTime() - new Date(a.creationDate).getTime()) ); setOptimizedTaskRouteSuggestion(result.notes); addToast("Active task route optimized by AI.", "success"); } catch (error) { addToast("AI route optimization failed.", "error"); console.error(error); } finally { setIsOptimizingTaskRoute(false); } };


  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 text-gray-900 dark:text-gray-100 provider-dashboard-main">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-3xl font-bold">Provider Dashboard</h1>
        <div className="flex items-center space-x-3 mt-3 md:mt-0">
          <span className={`text-sm font-medium ${isOnline ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {isOnline ? 'Online - Receiving Requests' : 'Offline - Not Receiving Requests'}
          </span>
          <button
            onClick={() => setIsOnline(!isOnline)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${isOnline ? 'bg-green-500 focus:ring-green-400' : 'bg-gray-300 dark:bg-gray-600 focus:ring-gray-400'}`}
          >
            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isOnline ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 earnings-section">
            <h2 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-200">Earnings Overview</h2>
            <div className="mb-4">
                <Button variant="outline" size="sm" onClick={() => setIsEarningsHistoryModalOpen(true)} className="dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700">
                    View Full Earnings History
                </Button>
            </div>
            <EarningsChart data={earnings} />
            {isLoading && <LoadingSpinner text="Loading insights..." />}
            {insightsError && <p className="text-red-500 dark:text-red-400 text-sm mt-2">{insightsError}</p>}
            {insights.length > 0 && (
              <div className="mt-4">
                <h3 className="text-md font-semibold text-gray-700 dark:text-gray-300">AI Insights:</h3>
                <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1 mt-1">
                  {insights.map((insight, index) => <li key={index}>{insight}</li>)}
                </ul>
              </div>
            )}
          </section>

          <section className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 heatmap-section">
             <HeatmapPlaceholder tiles={mockHeatmapData} />
          </section>
        </div>

        <div className="lg:col-span-1 space-y-6 manage-profile-section">
          <section className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-200">Manage Profile & Services</h2>
            <div className="space-y-2">
                <Button fullWidth variant="outline" onClick={() => setIsManageServicesModalOpen(true)} leftIcon={<Icon path={ICON_PATHS.WRENCH} />} className="dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700">My Services</Button>
                <Button fullWidth variant="outline" onClick={() => setIsManageProductsModalOpen(true)} leftIcon={<Icon path={ICON_PATHS.SHOPPING_BAG_ICON} />} className="dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700">My Products</Button>
                <Button fullWidth variant="outline" onClick={() => setIsManageVehiclesModalOpen(true)} leftIcon={<Icon path={ICON_PATHS.TRUCK} />} className="dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700">My Vehicles</Button>
                <Button fullWidth variant="outline" onClick={() => setIsManageAvailabilityModalOpen(true)} leftIcon={<Icon path={ICON_PATHS.CALENDAR_DAYS} />} className="dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700">My Availability</Button>
                <Button fullWidth variant="outline" onClick={() => setIsManageDocumentsModalOpen(true)} leftIcon={<Icon path={ICON_PATHS.DOCUMENT_TEXT} />} className="dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700">My Documents</Button>
                <Button fullWidth variant="outline" onClick={() => setIsPayoutSettingsModalOpen(true)} leftIcon={<Icon path={ICON_PATHS.BANKNOTES} />} className="dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700">Payout Settings</Button>
                 <Button fullWidth variant="outline" onClick={() => setIsSetWorkDestinationModalOpen(true)} leftIcon={<Icon path={ICON_PATHS.MAP_PIN} />} className="dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700">
                    {workDestination ? `Work Destination: ${workDestination.address?.substring(0,15) || `${workDestination.lat.toFixed(2)},${workDestination.lng.toFixed(2)}`}...` : "Set Work Destination"}
                </Button>
                 <Button fullWidth variant="outline" onClick={() => setIsManageDailyRoutesModalOpen(true)} leftIcon={<Icon path={ICON_PATHS.ARROW_PATH} />} className="dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700">My Daily Routes</Button>
            </div>
            <div className="mt-4 pt-3 border-t dark:border-gray-700">
                <h3 className="text-md font-semibold text-gray-700 dark:text-gray-300">My Rating:</h3>
                 {providerReviews.length > 0 ? (
                    <div className="flex items-center mt-1">
                        <StarRating rating={averageRating} readOnly size="md"/>
                        <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">({averageRating.toFixed(1)} from {providerReviews.length} reviews)</span>
                    </div>
                 ) : <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">No reviews yet.</p>}
            </div>
          </section>
           <section className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center mb-2">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Hunter Mode</h2>
                    <button onClick={handleToggleHunterMode} className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 ${hunterModeSettings.isEnabled ? 'bg-green-500 focus:ring-green-400' : 'bg-gray-300 dark:bg-gray-600 focus:ring-gray-400'}`}>
                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${hunterModeSettings.isEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                </div>
                <p className={`text-sm font-medium mb-2 ${hunterModeSettings.isEnabled ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                    {hunterModeSettings.isEnabled ? 'Actively hunting for nearby requests!' : 'Hunter Mode is OFF'}
                </p>
                <Button fullWidth variant="outline" onClick={() => setIsHunterModeSettingsModalOpen(true)} leftIcon={<Icon path={ICON_PATHS.COG_6_TOOTH} />} className="dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 text-sm">
                    Configure Hunter Settings
                </Button>
            </section>
        </div>
      </div>
      
      <section className="mt-6 bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-200">Incoming Opportunities</h2>
        {isFindingHuntedRequests && <div className="my-3"><LoadingSpinner text="Finding requests..." size="sm"/></div>}
        {isOnline && combinedIncomingRequests.length > 0 ? (
          <div className="space-y-4">
            {combinedIncomingRequests.map(req => (
              <div key={req.id} className={`p-3 border rounded-md hover:shadow-md dark:hover:shadow-gray-600 transition-shadow ${req.isHuntedRequest ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/30' : 'dark:border-gray-600'}`}>
                <h3 className="font-medium text-gray-800 dark:text-gray-100">{req.textInput || req.aiAnalysisSummary || `Request ${req.id}`} {req.isHuntedRequest && <span className="text-xs bg-blue-200 text-blue-800 dark:bg-blue-700 dark:text-blue-200 px-1.5 py-0.5 rounded-full ml-1">Hunter Find</span>}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Type: {req.type} | Suggested: ${req.suggestedPrice?.toFixed(2) || 'N/A'}</p>
                {req.origin && <p className="text-xs text-gray-400 dark:text-gray-500">From: {req.origin.address || `${req.origin.lat.toFixed(3)}, ${req.origin.lng.toFixed(3)}`}</p>}
                {req.destination && <p className="text-xs text-gray-400 dark:text-gray-500">To: {req.destination.address || `${req.destination.lat.toFixed(3)}, ${req.destination.lng.toFixed(3)}`}</p>}
                <div className="mt-2 flex space-x-2">
                  {req.isHuntedRequest ? (
                      <Button size="sm" variant="primary" onClick={() => handleOpenMakeOfferModal(req)}>Make Offer</Button>
                  ) : (
                      <Button size="sm" variant="primary" onClick={() => handleAcceptRequest(req.id)}>Accept Direct Invite</Button>
                  )}
                  <Button size="sm" variant="danger" onClick={() => handleRejectRequest(req.id)}>Reject</Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">{!isOnline ? "You are offline. Toggle Online to see new requests." : "No new incoming requests or hunted opportunities at the moment."}</p>
        )}
      </section>

      <section className="mt-6 bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 assigned-tasks-section">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">My Assigned Tasks</h2>
           {assignedTasks.length > 1 && (
            <Button size="sm" variant="outline" onClick={handleOptimizeActiveRoute} isLoading={isOptimizingTaskRoute} leftIcon={<Icon path={ICON_PATHS.ARROW_PATH}/>} className="dark:text-gray-300 dark:border-gray-600">AI Optimize Route</Button>
          )}
        </div>
        {optimizedTaskRouteSuggestion && <p className="text-xs text-blue-600 dark:text-blue-400 mb-2 p-1.5 bg-blue-50 dark:bg-blue-900/30 rounded">AI Suggestion: {optimizedTaskRouteSuggestion}</p>}
        {assignedTasks.length > 0 ? (
          <div className="space-y-4">
            {assignedTasks.map(task => {
              const action = getActionForStatus(task);
              return (
                <div key={task.id} className="p-3 border dark:border-gray-600 rounded-md hover:shadow-md dark:hover:shadow-gray-600 transition-shadow">
                  <h3 className="font-medium text-gray-800 dark:text-gray-100">{task.textInput || task.aiAnalysisSummary || `Task ${task.id}`}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Status: <span className="font-semibold">{formatStatusText(task.status)}</span></p>
                  {task.providerLastLocation && <p className="text-xs text-blue-500 dark:text-blue-400">Current Location: {task.providerLastLocation.address || `${task.providerLastLocation.lat.toFixed(2)},${task.providerLastLocation.lng.toFixed(2)}`}</p>}
                  <div className="mt-2 flex flex-wrap gap-2">
                    {action && <Button size="sm" variant="primary" onClick={() => handleTaskAction(task, action.actionType)} leftIcon={<Icon path={action.icon} className="w-4 h-4"/>}>{action.text}</Button>}
                    {(task.status === RequestStatus.PROVIDER_ASSIGNED || task.status === RequestStatus.EN_ROUTE || task.status === RequestStatus.SERVICE_IN_PROGRESS) && (
                        <>
                           <Button size="sm" variant="ghost" onClick={() => handleNavigation(task)} className="border dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700" leftIcon={<Icon path={ICON_PATHS.MAP_PIN} className="w-4 h-4"/>}>Navigate</Button>
                           <Button size="sm" variant="ghost" onClick={() => task.providerLastLocation ? handleStopSharingLocation(task.id) : handleStartSharingLocation(task)} className={`border ${task.providerLastLocation ? 'border-red-500 text-red-600 dark:text-red-400 dark:border-red-500 hover:bg-red-50 dark:hover:bg-red-700/50' : 'border-green-500 text-green-600 dark:text-green-400 dark:border-green-500 hover:bg-green-50 dark:hover:bg-green-700/50'}`} leftIcon={<Icon path={task.providerLastLocation ? ICON_PATHS.STOP_CIRCLE : ICON_PATHS.PLAY_CIRCLE} className="w-4 h-4"/>}>
                                {task.providerLastLocation ? 'Stop Location Sharing' : 'Start Location Sharing'}
                           </Button>
                        </>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => handleOpenChat(task)} className="border dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700" leftIcon={<Icon path={ICON_PATHS.CHAT_BUBBLE_LEFT_RIGHT} className="w-4 h-4"/>}>Chat with Requester</Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">No tasks currently assigned to you.</p>
        )}
      </section>

      <Button onClick={() => setIsHelpPanelOpen(true)} variant="ghost" className="fixed bottom-6 right-6 p-3 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-offset-gray-900" aria-label="Help"> <Icon path={ICON_PATHS.QUESTION_MARK_CIRCLE} className="w-6 h-6" /> </Button>
      
      <ManageServicesModal isOpen={isManageServicesModalOpen} onClose={() => setIsManageServicesModalOpen(false)} services={myServices} onAddService={handleAddService} onUpdateService={handleUpdateService} onDeleteService={handleDeleteService} />
      <ManageProductsModal isOpen={isManageProductsModalOpen} onClose={() => setIsManageProductsModalOpen(false)} products={myProducts} onAddProduct={handleAddProduct} onOpenScanModal={handleOpenScanModal}/>
      {isProductScanModalOpen && <ProductScanModal isOpen={isProductScanModalOpen} onClose={() => setIsProductScanModalOpen(false)} onProductDetailsReceived={handleProductDetailsFromScan} />}
      <ManageVehiclesModal isOpen={isManageVehiclesModalOpen} onClose={() => setIsManageVehiclesModalOpen(false)} vehicles={myVehicles} onAddVehicle={handleAddVehicle} />
      <ManageAvailabilityModal isOpen={isManageAvailabilityModalOpen} onClose={() => setIsManageAvailabilityModalOpen(false)} availability={myAvailability} onSaveAvailability={handleSaveAvailability} blockedTimeSlots={myBlockedTimeSlots} onAddBlockedTimeSlot={handleAddBlockedTimeSlot} onDeleteBlockedTimeSlot={handleDeleteBlockedTimeSlot}/>
      <ManageDocumentsModal isOpen={isManageDocumentsModalOpen} onClose={() => setIsManageDocumentsModalOpen(false)} documents={myDocuments} onAddDocument={handleAddDocument} onDeleteDocument={handleDeleteDocument} />
      <PayoutSettingsModal isOpen={isPayoutSettingsModalOpen} onClose={() => setIsPayoutSettingsModalOpen(false)} payoutAccounts={myPayoutAccounts} payoutHistory={myPayoutHistory} currentBalance={myMockBalance} onAddAccount={handleAddPayoutAccount} onSetPrimaryAccount={handleSetPrimaryPayoutAccount} onDeleteAccount={handleDeletePayoutAccount} onRequestPayout={handleRequestPayout} />
      <SetWorkDestinationModal isOpen={isSetWorkDestinationModalOpen} onClose={() => setIsSetWorkDestinationModalOpen(false)} onSetDestination={handleSetWorkDestination} currentDestination={workDestination} />
      <ManageDailyRoutesModal isOpen={isManageDailyRoutesModalOpen} onClose={() => setIsManageDailyRoutesModalOpen(false)} routes={myDailyRoutes} onSaveRoute={handleSaveRoute} onDeleteRoute={handleDeleteRoute}/>
      <HunterModeSettingsModal isOpen={isHunterModeSettingsModalOpen} onClose={() => setIsHunterModeSettingsModalOpen(false)} currentSettings={hunterModeSettings} onSaveSettings={handleSaveHunterSettings} />
      {requestToMakeOfferOn && <MakeOfferModal isOpen={isMakeOfferModalOpen} onClose={()=> {setIsMakeOfferModalOpen(false); setRequestToMakeOfferOn(null);}} request={requestToMakeOfferOn} onSubmitOffer={(offer, msg) => handleSubmitOffer(requestToMakeOfferOn.id, offer, msg)} />}
      <ProviderEarningsHistoryModal isOpen={isEarningsHistoryModalOpen} onClose={() => setIsEarningsHistoryModalOpen(false)} completedTasks={completedTasksForHistory} totalEarnings={totalEarnedFromTasks} totalPayouts={totalPaidOutAmount} currentBalance={myMockBalance} />
      {taskToRateRequesterFor && user && (
        <RateRequesterModal 
            isOpen={isRateRequesterModalOpen} 
            onClose={() => {setIsRateRequesterModalOpen(false); setTaskToRateRequesterFor(null);}} 
            onSubmitRating={handleRateRequesterSubmit}
            requesterName={taskToRateRequesterFor.requesterId || "Requester"} 
            requestSummary={taskToRateRequesterFor.textInput || taskToRateRequesterFor.aiAnalysisSummary || "Task"}
        />
      )}
       {currentChatRequest && user && ( <ChatModal isOpen={isChatModalOpen} onClose={() => setIsChatModalOpen(false)} requestId={currentChatRequest.id} currentUser={user} otherPartyName={`Requester (ID: ${currentChatRequest.requesterId.substring(0,6)}...)`} initialMessages={currentChatRequest.chatMessages || []} onSendMessage={handleSendMessage} /> )}
      <ContextualHelpPanel isOpen={isHelpPanelOpen} onClose={() => setIsHelpPanelOpen(false)} pageKey="provider-portal"/>
      <OnboardingTour tourKey="onboardingTourShown_provider_v3" steps={onboardingStepsProvider} isOpen={isOnboardingOpen} onClose={() => { setIsOnboardingOpen(false); localStorage.setItem('onboardingTourShown_provider_v3', 'true'); }}/>
    </div>
  );
};

export default ProviderPortalPage;