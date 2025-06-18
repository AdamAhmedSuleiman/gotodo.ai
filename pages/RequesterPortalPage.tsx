// src/pages/RequesterPortalPage.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import RequestForm from '../App components/request/RequestForm.js';
import { 
    RequestData, ServiceType, AIAnalysisResult, GeoLocation, Review, 
    MockProviderBid, RequestStatus, DisputeDetails, RecipientDetails, 
    MapMarkerData, MockProviderProfile, Product, SavedPlace, SavedMember, 
    ChatMessage, User, JourneyPlan, JourneyStop, JourneyAction, StopActionType,
    ConfigureStopActionModalProps, PickupPersonActionDetails, PickupItemActionDetails, 
    AssignTaskActionDetails, DropoffPersonActionDetails, DropoffItemActionDetails
} from '../src/types.js'; 
import Icon from '../App components/ui/Icon.js'; 
import { ICON_PATHS, APP_NAME } from '../src/constants.js'; 
import MapDisplay from '../App components/map/MapDisplay.js'; 
import Button from '../App components/ui/Button.js'; 
import Input from '../App components/ui/Input.js'; 
import Textarea from '../App components/ui/Textarea.js'; 
import LeaveReviewModal from '../App components/request/LeaveReviewModal.js';
import StarRating from '../App components/ui/StarRating.js'; 
import ContextualHelpPanel from '../App components/ui/ContextualHelpPanel.js'; 
import LoadingSpinner from '../App components/ui/LoadingSpinner.js'; 
import { analyzeRequestWithGemini, getDynamicPriceSuggestion } from '../services/geminiService.js'; 
import * as mapService from '../services/mapService.js'; 
import * as providerService from '../services/providerService.js'; 
import * as userDataService from '../services/userDataService.js'; 
import * as taskService from '../services/taskService.js'; 
import { useAuth } from '../contexts/AuthContext.js'; 
import { useToast } from '../contexts/ToastContext.js';
import { useNotifications } from '../contexts/NotificationContext.js'; 
import ViewBidsModal from '../App components/request/ViewBidsModal.js';
import ProviderProfileViewModal from '../App components/requester/ProviderProfileViewModal.js'; 
import OnboardingTour from '../App components/ui/OnboardingTour.js'; 
import RequestStatusTimeline from '../App components/request/RequestStatusTimeline.js';
import ReportIssueModal from '../App components/request/ReportIssueModal.js';
import PaymentModal from '../App components/request/PaymentModal.js'; 
import SelectionInfoPanel from '../App components/map/SelectionInfoPanel.js'; 
import ChatModal from '../App components/shared/ChatModal.js';
import JourneyPlannerPanel from '../App components/journey/JourneyPlannerPanel.js';
import ConfigureStopActionModal from '../App components/journey/ConfigureStopActionModal.js';

const mockPastRequests: RequestData[] = [ { id: 'req1', requesterId: 'user1', type: ServiceType.RIDE_DELIVERY, textInput: 'Ride to airport', status: RequestStatus.COMPLETED, creationDate: '2023-10-15', suggestedPrice: 25, providerId: 'prov1', assignedProviderName: 'Speedy Rides', origin: {lat: 37.7749, lng: -122.4194, address: "Home"}, destination: {lat: 37.6213, lng: -122.3790, address:"SFO Airport"}, requestFor: 'self', earnedAmount: 20 }, ];
const defaultMapCenter: google.maps.LatLngLiteral = { lat: 37.7749, lng: -122.4194 };
const onboardingSteps = [ { elementQuerySelector: '.map-centric-layout', title: 'Welcome to the Map-Centric Requester Portal!', content: 'Create and manage your requests directly on the map.', position: 'center' as const }, { elementQuerySelector: '.request-panel', title: 'Request Panel', content: 'Input your request details here. Specify if it\'s for you or someone else, set locations, and describe what you need.', position: 'right' as const }, { elementQuerySelector: '#map-display-main', title: 'Interactive Map', content: 'Use the map to set locations, view available providers, and track ongoing services.', position: 'left' as const }, { elementQuerySelector: '.active-requests-section', title: 'Your Request History', content: 'Monitor the status of all your past and current requests below the map area.', position: 'bottom' as const },];

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const RequesterPortalPage: React.FC = () => {
  const { user } = useAuth() as { user: User };
  const { addToast } = useToast();
  const { addNotification } = useNotifications(); 
  const locationHook = useLocation();

  const [isJourneyPlanningMode, setIsJourneyPlanningMode] = useState(false);
  const [currentJourneyPlan, setCurrentJourneyPlan] = useState<JourneyPlan | null>(null);
  const [selectedJourneyStopIdForMapAction, setSelectedJourneyStopIdForMapAction] = useState<string | null>(null);
  const [isFinalizingJourney, setIsFinalizingJourney] = useState(false);


  const [requestFor, setRequestFor] = useState<'self' | 'someone_else'>('self');
  const [origin, setOrigin] = useState<GeoLocation | null>(null);
  const [destination, setDestination] = useState<GeoLocation | null>(null);
  const [recipientDetails, setRecipientDetails] = useState<RecipientDetails>({});
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([]);
  const [savedMembers, setSavedMembers] = useState<SavedMember[]>([]);
  const [mapCenter, setMapCenter] = useState<google.maps.LatLngLiteral>(defaultMapCenter);
  const [mapZoom, setMapZoom] = useState<number>(12);
  const [mapMarkers, setMapMarkers] = useState<MapMarkerData[]>([]);
  const [displayedProviders, setDisplayedProviders] = useState<MockProviderProfile[]>([]);
  const [selectedMapItem, setSelectedMapItem] = useState<MapMarkerData | null>(null);
  const [isSelectionInfoPanelOpen, setIsSelectionInfoPanelOpen] = useState(false);
  const [activeRequests, setActiveRequests] = useState<RequestData[]>(() => { const stored = localStorage.getItem(`gotodo_requester_tasks_${user?.id || 'default'}`); return stored ? JSON.parse(stored) : mockPastRequests.sort((a,b) => new Date(b.creationDate).getTime() - new Date(a.creationDate).getTime()); });
  const [isRequestSubmitted, setIsRequestSubmitted] = useState(false);
  const [lastAISummary, setLastAISummary] = useState<string | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [requestToReview, setRequestToReview] = useState<RequestData | null>(null);
  const [isHelpPanelOpen, setIsHelpPanelOpen] = useState(false);
  const [isViewBidsModalOpen, setIsViewBidsModalOpen] = useState(false);
  const [requestForBids, setRequestForBids] = useState<RequestData | null>(null);
  const [isProviderProfileModalOpen, setIsProviderProfileModalOpen] = useState(false); 
  const [providerToView, setProviderToView] = useState<MockProviderProfile | null>(null); 
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(() => !localStorage.getItem('onboardingTourShown_requester_map_v3'));
  const [isReportIssueModalOpen, setIsReportIssueModalOpen] = useState(false);
  const [requestToReport, setRequestToReport] = useState<RequestData | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [requestForPayment, setRequestForPayment] = useState<RequestData | null>(null);
  const [refinedPrices, setRefinedPrices] = useState<Record<string, { price?: number; loading: boolean; error?: string }>>({});
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [currentChatRequest, setCurrentChatRequest] = useState<RequestData | null>(null);
  const providerLocationIntervalRef = useRef<number | null>(null);
  const [isRequestPanelOpen, setIsRequestPanelOpen] = useState(true);

  const [isStopActionModalOpen, setIsStopActionModalOpen] = useState(false);
  const [currentStopIdForAction, setCurrentStopIdForAction] = useState<string | null>(null);
  const [currentActionType, setCurrentActionType] = useState<StopActionType | null>(null);
  const [existingActionToEdit, setExistingActionToEdit] = useState<JourneyAction | undefined>(undefined);

  useEffect(() => { localStorage.setItem(`gotodo_requester_tasks_${user?.id || 'default'}`, JSON.stringify(activeRequests)); }, [activeRequests, user?.id]);
  useEffect(() => { if (user) { setSavedPlaces(userDataService.getSavedPlaces(user.id)); setSavedMembers(userDataService.getSavedMembers(user.id)); } }, [user]);
  
  useEffect(() => {
    if (isJourneyPlanningMode && currentJourneyPlan) {
        const journeyStopMarkers: MapMarkerData[] = currentJourneyPlan.stops
            .filter(stop => stop.location)
            .map((stop, index, arr) => {
                let type: MapMarkerData['type'] = 'journey_stop';
                let titlePrefix = `S${index}`;
                if (index === 0) {
                    type = 'origin';
                    titlePrefix = 'O';
                } else if (index === arr.length - 1) {
                    type = 'destination';
                    titlePrefix = 'D';
                }
                 return { 
                    id: `journey-${stop.id}`,
                    position: stop.location!,
                    type: type,
                    title: `${titlePrefix}: ${stop.name} (${stop.addressInput || 'Location Set'})`,
                    data: stop
                };
            });
        setMapMarkers(journeyStopMarkers);
        if (journeyStopMarkers.length > 0 && window.google?.maps?.LatLngBounds) { 
            const bounds = new window.google.maps.LatLngBounds();
            journeyStopMarkers.forEach(marker => bounds.extend(marker.position));
            // if (mapInstance) mapInstance.fitBounds(bounds); // Already commented out
            // Simple centering on the first stop, could be improved to fit bounds
            // setMapCenter(journeyStopMarkers[0].position); 
            // if (journeyStopMarkers.length > 1) setMapZoom(10); else setMapZoom(14);
        }
    } else if (!isJourneyPlanningMode) {
        const singleRequestMarkers: MapMarkerData[] = [];
        if (origin?.lat && origin?.lng) singleRequestMarkers.push({id: 'origin', position: origin, type: 'origin', title: 'Origin: ' + (origin.address || 'Selected Location')});
        if (destination?.lat && destination?.lng) singleRequestMarkers.push({id: 'destination', position: destination, type: 'destination', title: 'Destination: ' + (destination.address || 'Selected Location')});
        
        const providerMarkers = displayedProviders.map(p => ({ id: p.id, position: p.location, type: 'provider', title: p.name, data: p } as MapMarkerData));
        setMapMarkers([...singleRequestMarkers, ...providerMarkers]);

        const enRouteTask = activeRequests.find(r => r.status === RequestStatus.EN_ROUTE && r.providerLastLocation);
        if (enRouteTask && enRouteTask.providerLastLocation) {
            setMapMarkers(prev => [...prev.filter(m => m.id !== 'provider-live-loc'), {id: 'provider-live-loc', position: enRouteTask.providerLastLocation!, type: 'current_provider_location', title: `${enRouteTask.assignedProviderName}'s Location`}]);
        } else {
             setMapMarkers(prev => prev.filter(m => m.id !== 'provider-live-loc'));
        }

    }
  }, [currentJourneyPlan, isJourneyPlanningMode, displayedProviders, activeRequests, origin, destination]);


  const initializeNewJourneyPlan = () => {
    if (!user) return;
    const newPlan: JourneyPlan = {
      id: `journey-${generateId()}`,
      title: "My New Journey",
      stops: [
        { id: `stop-${generateId()}`, name: "Origin", addressInput: "", actions: [], sequence: 0 },
        { id: `stop-${generateId()}`, name: "Final Destination", addressInput: "", actions: [], sequence: 1 }
      ],
      status: 'draft',
      creationDate: new Date().toISOString(),
      requesterId: user.id,
    };
    setCurrentJourneyPlan(newPlan);
    setIsJourneyPlanningMode(true);
    setIsRequestPanelOpen(true); 
    setIsRequestSubmitted(false); 
    setOrigin(null); setDestination(null); 
  };
  
  const handleMapClickForJourneyStop = async (location: google.maps.LatLngLiteral) => {
    if (!selectedJourneyStopIdForMapAction || !currentJourneyPlan) return;
    try {
      const results = await mapService.geocodeAddress(`${location.lat},${location.lng}`);
      const address = results[0]?.formatted_address || `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`;
      
      updateJourneyStop(selectedJourneyStopIdForMapAction, { 
        addressInput: address, 
        location: { ...location, address }
      });
      addToast(`Location set for stop: ${address}`, "success");
    } catch (error) {
      addToast("Failed to get address for selected location.", "error");
      console.error("Geocoding error:", error);
       updateJourneyStop(selectedJourneyStopIdForMapAction, { 
        addressInput: `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`, 
        location: { ...location, address: `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}` }
      });
    }
    setSelectedJourneyStopIdForMapAction(null); 
  };


  const updateJourneyStop = (stopId: string, updates: Partial<JourneyStop>) => {
    setCurrentJourneyPlan(prevPlan => {
      if (!prevPlan) return null;
      const updatedStops = prevPlan.stops.map(s => 
        s.id === stopId ? { ...s, ...updates } : s
      );
      return { ...prevPlan, stops: updatedStops };
    });
  };

  const addJourneyStop = () => {
    setCurrentJourneyPlan(prevPlan => {
      if (!prevPlan) return null;
      const newStopSequence = prevPlan.stops.length -1; 
      const newStop: JourneyStop = {
        id: `stop-${generateId()}`,
        name: `Stop ${newStopSequence}`,
        addressInput: "",
        actions: [],
        sequence: newStopSequence
      };
      const stops = [...prevPlan.stops];
      stops.splice(newStopSequence, 0, newStop);
      const resequencedStops = stops.map((s, index) => ({
        ...s, 
        sequence: index,
        name: index === 0 ? "Origin" : (index === stops.length - 1 ? "Final Destination" : `Stop ${index}`)
      }));
      return { ...prevPlan, stops: resequencedStops };
    });
  };

  const removeJourneyStop = (stopId: string) => {
    setCurrentJourneyPlan(prevPlan => {
      if (!prevPlan || prevPlan.stops.length <= 2) { 
        addToast("Cannot remove origin or final destination if only two stops exist.", "warning");
        return prevPlan;
      }
      const updatedStops = prevPlan.stops.filter(s => s.id !== stopId)
        .map((s, index, arr) => ({ 
          ...s,
          sequence: index,
          name: index === 0 ? "Origin" : (index === arr.length - 1 ? "Final Destination" : `Stop ${index}`)
        }));
      return { ...prevPlan, stops: updatedStops };
    });
  };

  const openStopActionModal = (stopId: string, actionType: StopActionType, actionToEdit?: JourneyAction) => {
    setCurrentStopIdForAction(stopId);
    setCurrentActionType(actionType);
    setExistingActionToEdit(actionToEdit);
    setIsStopActionModalOpen(true);
  };

  const handleSaveStopAction = (stopId: string, action: JourneyAction) => {
    setCurrentJourneyPlan(prevPlan => {
      if (!prevPlan) return null;
      const updatedStops = prevPlan.stops.map(s => {
        if (s.id === stopId) {
          const existingActionIndex = s.actions.findIndex(a => a.id === action.id);
          let newActions;
          if (existingActionIndex > -1) { 
            newActions = [...s.actions];
            newActions[existingActionIndex] = action;
          } else { 
            newActions = [...s.actions, action];
          }
          return { ...s, actions: newActions };
        }
        return s;
      });
      return { ...prevPlan, stops: updatedStops };
    });
    setIsStopActionModalOpen(false);
    addToast(`Action "${action.type.replace('_', ' ')}" configured for stop.`, "success");
  };
  
  const handleDeleteJourneyAction = (stopId: string, actionId: string) => {
    setCurrentJourneyPlan(prevPlan => {
      if (!prevPlan) return null;
      const updatedStops = prevPlan.stops.map(s => {
        if (s.id === stopId) {
          return { ...s, actions: s.actions.filter(a => a.id !== actionId) };
        }
        return s;
      });
      return { ...prevPlan, stops: updatedStops };
    });
    addToast("Action removed from stop.", "info");
  };

  const handleFinalizeJourney = async () => {
    if (!currentJourneyPlan || !user) {
      addToast("No journey to finalize or user not found.", "warning");
      return;
    }
    if (currentJourneyPlan.stops.some(s => !s.location)) {
      addToast("All stops must have a valid location before finalizing.", "error");
      return;
    }
     if (currentJourneyPlan.stops.length > 2 && currentJourneyPlan.stops.slice(1, -1).some(s => s.actions.length === 0)) {
       const emptyStop = currentJourneyPlan.stops.slice(1,-1).find(s => s.actions.length === 0);
       if (emptyStop) {
         addToast(`Intermediate stop "${emptyStop.name}" has no actions. Please configure actions or remove the stop.`, "error");
         return;
       }
    }


    setIsFinalizingJourney(true);
    addToast("Finalizing Journey... This may take a moment.", "info");
    
    const newRequestsPromises: Promise<RequestData | null>[] = [];

    for (const stop of currentJourneyPlan.stops) {
      for (const action of stop.actions) {
        if (action.type !== 'pickup_person' && action.type !== 'pickup_item' && action.type !== 'assign_task') {
          console.log(`Journey: Action "${action.type}" at stop "${stop.name}" skipped for sub-request generation.`);
          continue;
        }

        let textInput = `Journey Task: "${currentJourneyPlan.title}" - Stop: "${stop.name}" (${stop.addressInput || 'N/A'}) - Action: ${action.type.replace(/_/g, ' ')}.`;
        let serviceType: ServiceType = ServiceType.GENERAL_HELP;
        let baseEntities: Record<string, any> = { journeyContext: `Part of journey "${currentJourneyPlan.title}" at stop "${stop.name}"`};
        let destinationForAction: GeoLocation | undefined = undefined;
        let requestForField: 'self' | 'someone_else' = 'self';
        let recipientDetailsForAction: RecipientDetails | undefined = undefined;

        switch (action.type) {
          case 'pickup_person':
            const ppDetails = action.details as PickupPersonActionDetails;
            serviceType = ServiceType.RIDE_DELIVERY;
            textInput += ` Pickup ${ppDetails.passengerCount || 1} person(s). Luggage: ${ppDetails.luggage || 'N/A'}. For: ${ppDetails.pickupFor}.`;
            if(ppDetails.pickupFor === 'someone_else') {
              textInput += ` Target: ${ppDetails.targetNameOrId}.`;
              requestForField = 'someone_else';
              recipientDetailsForAction = { name: ppDetails.targetNameOrId, contact: ppDetails.targetMobile, notes: ppDetails.notes };
            }
            if(ppDetails.transportationType) textInput += ` Vehicle: ${ppDetails.transportationType} ${ppDetails.vehicleSubType || ''}. ${ppDetails.transportationDetails || ''}`;
            if(ppDetails.notes && ppDetails.pickupFor !== 'someone_else') textInput += ` Notes: ${ppDetails.notes}.`;
            baseEntities = {...baseEntities, ...ppDetails};
            const nextStopIndex = currentJourneyPlan.stops.findIndex(s => s.id === stop.id) + 1;
            if (nextStopIndex < currentJourneyPlan.stops.length) {
                 destinationForAction = currentJourneyPlan.stops[nextStopIndex].location;
            } else {
                 destinationForAction = currentJourneyPlan.stops[currentJourneyPlan.stops.length -1].location;
            }
            break;
          case 'pickup_item':
            const piDetails = action.details as PickupItemActionDetails;
            serviceType = ServiceType.RIDE_DELIVERY; 
            textInput += ` Pickup ${piDetails.quantity || 1} ${piDetails.unit || 'item(s)'}: ${piDetails.itemDescription || piDetails.productNameOrCode}. From: ${piDetails.pickupFrom}.`;
            if(piDetails.pickupFrom === 'someone_else') {
              textInput += ` Contact: ${piDetails.nameOrUserId} at ${piDetails.companyName || 'location'}.`;
              requestForField = 'someone_else'; 
              recipientDetailsForAction = { name: piDetails.nameOrUserId, contact: piDetails.mobile, notes: `Pickup from ${piDetails.companyName || 'location'}` };
            }
            if(piDetails.instructionsToDriver) textInput += ` Instructions: ${piDetails.instructionsToDriver}.`;
            baseEntities = {...baseEntities, ...piDetails};
            const nextItemDropoffStop = currentJourneyPlan.stops.find((s, idx) => idx > stop.sequence && s.actions.some(a => a.type === 'dropoff_item'));
            destinationForAction = nextItemDropoffStop?.location || currentJourneyPlan.stops[currentJourneyPlan.stops.length -1].location;
            break;
          case 'assign_task':
            const atDetails = action.details as AssignTaskActionDetails;
            serviceType = ServiceType.PROFESSIONAL_SERVICE; 
            textInput += ` Task: ${atDetails.taskDetails}. Assign to: ${atDetails.assignTo}.`;
            if(atDetails.assignTo === 'someone_else' && atDetails.selectedPersonId) {
                textInput += ` Assigned Person: ${atDetails.selectedPersonId}`;
                requestForField = 'someone_else';
                recipientDetailsForAction = { name: atDetails.selectedPersonId, notes: atDetails.notes };
            }
            if(atDetails.notes && atDetails.assignTo !== 'someone_else') textInput += ` Notes: ${atDetails.notes}.`;
            baseEntities = {...baseEntities, ...atDetails};
            destinationForAction = stop.location; 
            break;
        }
        
        const requestDetailsForAI = {
            textInput,
            origin: stop.location,
            destination: destinationForAction,
            requestFor: requestForField,
            recipientDetails: recipientDetailsForAction
        };
        
        newRequestsPromises.push(
          (async () => {
            try {
              addToast(`AI Analyzing: ${action.type.replace(/_/g, ' ')} at ${stop.name}...`, "info");
              const aiAnalysis = await analyzeRequestWithGemini(requestDetailsForAI);
              
              const finalServiceType = aiAnalysis.type !== ServiceType.UNKNOWN ? aiAnalysis.type : serviceType;
              const finalEntities = {...baseEntities, ...aiAnalysis.entities};
              const finalPriceSuggestion = aiAnalysis.priceSuggestion;
              const finalSummary = aiAnalysis.summary || textInput;

              addToast(`Sub-request: "${finalSummary.substring(0,30)}..." created.`, "success");
              return {
                id: `req-${generateId()}`,
                requesterId: user.id,
                status: RequestStatus.PENDING,
                creationDate: new Date().toISOString(),
                textInput: finalSummary,
                type: finalServiceType,
                origin: stop.location, 
                destination: destinationForAction,
                aiAnalysisSummary: finalSummary,
                aiExtractedEntities: finalEntities,
                suggestedPrice: finalPriceSuggestion,
                journeyPlanId: currentJourneyPlan.id,
                journeyStopId: stop.id,
                journeyActionId: action.id,
                requestFor: requestForField, 
                recipientDetails: recipientDetailsForAction,
              } as RequestData;
            } catch (err) {
              console.error(`AI analysis failed for journey sub-task "${action.type}" at "${stop.name}", creating with basic details. Error:`, err);
              addToast(`AI failed for "${action.type.replace(/_/g, ' ')}". Creating basic request.`, "warning");
              return {
                id: `req-${generateId()}`,
                requesterId: user.id, status: RequestStatus.PENDING, creationDate: new Date().toISOString(),
                textInput, type: serviceType, origin: stop.location, destination: destinationForAction,
                aiExtractedEntities: baseEntities, journeyPlanId: currentJourneyPlan.id, journeyStopId: stop.id, journeyActionId: action.id, requestFor: requestForField, recipientDetails: recipientDetailsForAction,
              } as RequestData;
            }
          })()
        );
      }
    }
    
    const createdRequests = (await Promise.all(newRequestsPromises)).filter(r => r !== null) as RequestData[];
    
    if (createdRequests.length > 0) {
        setActiveRequests(prev => [...createdRequests, ...prev].sort((a,b) => new Date(b.creationDate).getTime() - new Date(a.creationDate).getTime()));
    }
    
    const allSubRequestsSucceeded = createdRequests.length === newRequestsPromises.length;
    if (allSubRequestsSucceeded && createdRequests.length > 0) {
        addToast(`Journey finalized! ${createdRequests.length} sub-request(s) created. Check your request history.`, "success");
    } else if (createdRequests.length > 0) {
        addToast(`Journey finalized with some issues. ${createdRequests.length} sub-request(s) created. Some may require manual review.`, "warning");
    } else {
        addToast(`Journey finalized, but no actionable sub-requests were generated.`, "info");
    }
    
    setIsJourneyPlanningMode(false); 
    setCurrentJourneyPlan(null); 
    setIsRequestPanelOpen(false);
    setIsFinalizingJourney(false);
  };


  const isValidGeoLocation = (loc: any): loc is GeoLocation => { return loc && typeof loc.lat === 'number' && typeof loc.lng === 'number'; };
  const processNewRequest = ( baseRequestDetails: Partial<Omit<RequestData, 'id' | 'requesterId' | 'status' | 'creationDate'>>, aiAnalysis?: AIAnalysisResult ) => { const newRequest: RequestData = { id: `req-${Date.now()}`, requesterId: user.id, status: RequestStatus.PENDING, creationDate: new Date().toISOString(), ...baseRequestDetails, type: baseRequestDetails.type || aiAnalysis?.type || ServiceType.UNKNOWN, suggestedPrice: baseRequestDetails.suggestedPrice ?? aiAnalysis?.priceSuggestion, aiAnalysisSummary: baseRequestDetails.aiAnalysisSummary || aiAnalysis?.summary, aiExtractedEntities: baseRequestDetails.aiExtractedEntities || aiAnalysis?.entities, requestFor: baseRequestDetails.requestFor || 'self', } as RequestData; setActiveRequests(prev => [newRequest, ...prev].sort((a,b) => new Date(b.creationDate).getTime() - new Date(a.creationDate).getTime())); setLastAISummary(newRequest.aiAnalysisSummary || "Request processed."); setIsRequestSubmitted(true); addToast("New single request submitted successfully!", "success"); addNotification("Your new request has been submitted.", "info", `/requester-portal`); };
  const handleRequestSubmitFromForm = async ( requestDetailsForAI: Pick<RequestData, 'textInput' | 'imageB64Data' | 'hasAudio' | 'hasVideo' | 'numUploadedMedia' | 'origin' | 'destination' | 'requestFor' | 'recipientDetails' | 'targetMapLocation'>, aiAnalysis: AIAnalysisResult ) => { const baseRequestDetails: Partial<Omit<RequestData, 'id' | 'requesterId' | 'status' | 'creationDate'>> = { textInput: requestDetailsForAI.textInput, imageB64Data: requestDetailsForAI.imageB64Data, hasAudio: requestDetailsForAI.hasAudio, hasVideo: requestDetailsForAI.hasVideo, numUploadedMedia: requestDetailsForAI.numUploadedMedia, requestFor: requestFor, recipientDetails: requestFor === 'someone_else' ? recipientDetails : undefined, origin: origin || undefined, destination: destination || undefined, targetMapLocation: requestDetailsForAI.targetMapLocation, type: aiAnalysis.type, suggestedPrice: aiAnalysis.priceSuggestion, aiAnalysisSummary: aiAnalysis.summary, aiExtractedEntities: aiAnalysis.entities, }; processNewRequest(baseRequestDetails, aiAnalysis); const searchLocation = baseRequestDetails.targetMapLocation || baseRequestDetails.origin || defaultMapCenter; const providers = await providerService.getMockProviders(aiAnalysis.type, searchLocation); setDisplayedProviders(providers); if(providers.length === 0) addToast("No providers found for single request.", "info"); else addToast(`${providers.length} provider(s) found for single request. Check the map!`, "success"); setOrigin(null); setDestination(null); setRecipientDetails({}); setRequestFor('self'); setIsRequestPanelOpen(false); };
  useEffect(() => { if (locationHook.state?.newRequestFromInteraction) { const { newRequestFromInteraction, aiAnalysis } = locationHook.state as { newRequestFromInteraction: Partial<RequestData>, aiAnalysis?: AIAnalysisResult }; processNewRequest(newRequestFromInteraction, aiAnalysis); window.history.replaceState({}, document.title); } }, [locationHook.state, user?.id]); 
  const createAnotherRequest = () => { setIsRequestSubmitted(false); setLastAISummary(null); setMapCenter(defaultMapCenter); setMapMarkers([]); setMapZoom(12); setDisplayedProviders([]); setSelectedMapItem(null); setIsSelectionInfoPanelOpen(false); setIsRequestPanelOpen(true); setOrigin(null); setDestination(null); };
  const handleMapMarkerClick = (markerData: MapMarkerData) => { setSelectedMapItem(markerData); setIsSelectionInfoPanelOpen(true); if(markerData.position) { setMapCenter(markerData.position); setMapZoom(15); }};
  const closeSelectionInfoPanel = () => setIsSelectionInfoPanelOpen(false);
  const openReviewModal = (request: RequestData) => { setRequestToReview(request); setIsReviewModalOpen(true); };
  const handleReviewSubmit = (rating: number, text: string) => { if (!requestToReview) return; const newReview: Review = { rating, text, date: new Date().toISOString(), reviewerName: user?.name || "Requester" }; setActiveRequests(prevRequests => prevRequests.map(req => req.id === requestToReview.id ? { ...req, review: newReview } : req ).sort((a,b) => new Date(b.creationDate).getTime() - new Date(a.creationDate).getTime())); setIsReviewModalOpen(false); setRequestToReview(null); addToast("Review submitted successfully! Thank you.", "success"); };
  const openReportIssueModal = (request: RequestData) => { setRequestToReport(request); setIsReportIssueModalOpen(true); };
  const handleReportIssueSubmit = (reason: string, description: string) => { if (!requestToReport) return; const newDisputeDetails: DisputeDetails = { reason, description, reportedDate: new Date().toISOString(),}; setActiveRequests(prevRequests => prevRequests.map(req => req.id === requestToReport.id ? { ...req, status: RequestStatus.DISPUTED, disputeDetails: newDisputeDetails } : req ).sort((a,b) => new Date(b.creationDate).getTime() - new Date(a.creationDate).getTime())); addToast(`Issue reported for request: ${requestToReport.id.substring(0,6)}. Status set to Disputed.`, "warning"); addNotification(`Your reported issue for task ${requestToReport.id.substring(0,6)} is under review.`, "warning"); setIsReportIssueModalOpen(false); setRequestToReport(null); };
  const openPaymentModal = (request: RequestData) => { setRequestForPayment(request); setIsPaymentModalOpen(true); };
  const handlePaymentSuccess = () => { if (!requestForPayment) return; const earned = taskService.recordEarnedAmount(requestForPayment); setActiveRequests(prevRequests => prevRequests.map(req => req.id === requestForPayment.id ? { ...req, status: RequestStatus.COMPLETED, earnedAmount: earned } : req ).sort((a,b) => new Date(b.creationDate).getTime() - new Date(a.creationDate).getTime())); addToast(`Payment for request ${requestForPayment.id.substring(0,6)} successful. Task Completed!`, "success"); addNotification(`Your payment for task ${requestForPayment.id.substring(0,6)} was successful.`, "success"); setIsPaymentModalOpen(false); setRequestForPayment(null); };
  const getStatusColor = (status: RequestStatus): string => { switch (status) { case RequestStatus.PENDING: return 'border-yellow-500 dark:border-yellow-400 text-yellow-600 dark:text-yellow-400'; case RequestStatus.AWAITING_ACCEPTANCE: return 'border-orange-500 dark:border-orange-400 text-orange-600 dark:text-orange-400'; case RequestStatus.PROVIDER_ASSIGNED: return 'border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-400'; case RequestStatus.EN_ROUTE: return 'border-cyan-500 dark:border-cyan-400 text-cyan-600 dark:text-cyan-400'; case RequestStatus.SERVICE_IN_PROGRESS: return 'border-indigo-500 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400'; case RequestStatus.PENDING_PAYMENT: return 'border-purple-500 dark:border-purple-400 text-purple-600 dark:text-purple-400'; case RequestStatus.COMPLETED: return 'border-green-500 dark:border-green-400 text-green-600 dark:text-green-400'; case RequestStatus.CANCELLED: return 'border-red-500 dark:border-red-400 text-red-600 dark:text-red-400'; case RequestStatus.DISPUTED: return 'border-pink-500 dark:border-pink-400 text-pink-600 dark:text-pink-400'; default: return 'border-gray-500 dark:border-gray-400 text-gray-600 dark:text-gray-400'; } };
  const formatStatusText = (status: RequestStatus) => status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  const handleGetRefinedPrice = async (request: RequestData) => { if (!request.type || !request.aiAnalysisSummary) { setRefinedPrices(prev => ({ ...prev, [request.id]: { loading: false, error: "Missing data for refined price."}})); addToast("Missing data for refined price calculation.", "error"); return; } setRefinedPrices(prev => ({ ...prev, [request.id]: { loading: true }})); try { const price = await getDynamicPriceSuggestion(request.type, request.aiAnalysisSummary, request.aiExtractedEntities || {}); setRefinedPrices(prev => ({ ...prev, [request.id]: { price, loading: false }})); addToast(`Refined price suggestion: $${price.toFixed(2)}`, "success"); } catch (err) { setRefinedPrices(prev => ({ ...prev, [request.id]: { loading: false, error: (err as Error).message }})); addToast("Failed to get refined price.", "error"); }};
  const openViewBidsModal = (request: RequestData) => { setRequestForBids(request); setIsViewBidsModalOpen(true); };
  const handleAcceptBid = (bid: MockProviderBid) => { if(requestForBids) { setActiveRequests(prev => prev.map(r => r.id === requestForBids.id ? { ...r, status: RequestStatus.PROVIDER_ASSIGNED, providerId: bid.providerId, assignedProviderName: bid.providerName, suggestedPrice: bid.bidAmount } : r ).sort((a,b) => new Date(b.creationDate).getTime() - new Date(a.creationDate).getTime())); addToast(`Bid from ${bid.providerName} accepted! Provider assigned.`, "success"); addNotification(`Provider ${bid.providerName} is assigned to your task: ${requestForBids.id.substring(0,6)}`, "success", `/requester-portal`); } setIsViewBidsModalOpen(false); setRequestForBids(null); };
  const handleCancelRequest = (requestId: string) => { let requestCancelled = false; setActiveRequests(prevRequests => prevRequests.map(req => { if (req.id === requestId && (req.status === RequestStatus.PENDING || req.status === RequestStatus.AWAITING_ACCEPTANCE || req.status === RequestStatus.PROVIDER_ASSIGNED)) { requestCancelled = true; return { ...req, status: RequestStatus.CANCELLED }; } return req; }).sort((a,b) => new Date(b.creationDate).getTime() - new Date(a.creationDate).getTime())); if (requestCancelled) { addToast("Request cancelled.", "info"); addNotification(`Your request ${requestId.substring(0,6)} has been cancelled.`, "info"); } else { addToast("Cannot cancel request at its current stage.", "warning");}};
  const handleOpenChat = (request: RequestData) => { setCurrentChatRequest(request); setIsChatModalOpen(true); };
  const handleSendMessage = (requestId: string, message: ChatMessage) => { taskService.addChatMessage(requestId, message); setActiveRequests(prev => prev.map(r => r.id === requestId ? {...r, chatMessages: taskService.getChatMessages(requestId)} : r)); addToast("Message sent (mock)!", "info"); };
  const handleViewProviderProfile = async (providerId: string) => { const profile = await providerService.getProviderProfileById(providerId); if (profile) { setProviderToView(profile); setIsProviderProfileModalOpen(true); } else { addToast("Could not load provider profile.", "error"); }};

  const journeyPathForMap = currentJourneyPlan?.stops.filter(s => s.location).map(s => s.location!) || [];


  return (
    <>
    <div className="h-[calc(100vh-64px-72px)] flex flex-col map-centric-layout relative overflow-hidden">
       <div id="map-display-main" className={`flex-grow transition-all duration-300 ease-in-out ${!isRequestPanelOpen ? 'w-full' : 'w-full md:w-[calc(100%-28rem)] md:ml-[28rem]'}`}>
         <MapDisplay 
            center={mapCenter} 
            zoom={mapZoom} 
            className="w-full h-full" 
            markers={mapMarkers} 
            onMapClick={isJourneyPlanningMode && selectedJourneyStopIdForMapAction ? handleMapClickForJourneyStop : (loc) => { 
              if (!isJourneyPlanningMode) {
                  if (!origin) { setOrigin({...loc, address: 'Origin (Map Click)'}); addToast("Origin set on map.", "info");}
                  else if (!destination) { setDestination({...loc, address: 'Destination (Map Click)'}); addToast("Destination set on map.", "info");}
                  else { addToast("Origin and Destination already set. Clear one to set new.", "warning"); }
              }
            }} 
            onMarkerClick={handleMapMarkerClick}
            journeyPath={isJourneyPlanningMode ? journeyPathForMap : undefined}
            route={!isJourneyPlanningMode && origin && destination ? {origin, destination} : undefined}
         />
        </div>
      <div className={`request-panel absolute top-0 left-0 h-full bg-white dark:bg-gray-800 shadow-2xl p-4 sm:p-5 transition-transform duration-300 ease-in-out overflow-y-auto w-full max-w-md sm:max-w-sm md:w-[28rem] ${!isRequestPanelOpen ? '-translate-x-full' : 'translate-x-0'}`}> 
        <Button onClick={() => setIsRequestPanelOpen(!isRequestPanelOpen)} variant="ghost" size="sm" className="absolute top-2 right-2 z-10 p-1" aria-label={!isRequestPanelOpen ? "Open request panel" : "Close request panel"}> <Icon path={!isRequestPanelOpen ? ICON_PATHS.LIST_BULLET : ICON_PATHS.X_MARK_ICON } className="w-5 h-5" /> </Button> 
        
        {isJourneyPlanningMode && currentJourneyPlan ? (
            <JourneyPlannerPanel
                journeyPlan={currentJourneyPlan}
                onUpdateStop={updateJourneyStop}
                onAddStop={addJourneyStop}
                onRemoveStop={removeJourneyStop}
                onConfigureAction={openStopActionModal}
                onFinalizeJourney={handleFinalizeJourney}
                isFinalizingJourney={isFinalizingJourney}
                onSetMapActionForStop={(stopId) => {
                    setSelectedJourneyStopIdForMapAction(stopId);
                    addToast("Click on the map to set location for this stop.", "info");
                }}
                onDeleteAction={handleDeleteJourneyAction}
                onExitJourneyMode={() => {setIsJourneyPlanningMode(false); setCurrentJourneyPlan(null); setMapMarkers([]); createAnotherRequest();}}
            />
        ) : isRequestSubmitted ? ( 
            <div className="text-center p-6 bg-green-50 dark:bg-green-900 dark:bg-opacity-30 border border-green-200 dark:border-green-700 rounded-lg shadow-md h-full flex flex-col justify-center items-center"> <Icon path={ICON_PATHS.CHECK_CIRCLE} className="w-16 h-16 text-green-500 dark:text-green-400 mx-auto mb-3" /> <h3 className="text-2xl font-semibold text-green-700 dark:text-green-300 mb-2">Request Submitted!</h3> {lastAISummary && <p className="text-gray-700 dark:text-gray-300 mb-1">Summary: "{lastAISummary}"</p>} <p className="text-gray-600 dark:text-gray-400">We are now finding providers. Check the map or your request history below.</p> 
            <div className="mt-6 space-y-2">
                 <Button type="button" onClick={createAnotherRequest} variant="primary"> Create Single Request </Button> 
                 <Button type="button" onClick={initializeNewJourneyPlan} variant="secondary" className="dark:bg-gray-600 dark:hover:bg-gray-500"> Plan New Journey </Button>
            </div>
            </div> 
        ) : ( 
            <> 
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-3">Create New Request</h2> 
                <RequestForm onSubmit={handleRequestSubmitFromForm} origin={origin} destination={destination} requestFor={requestFor} recipientDetails={requestFor === 'someone_else' ? recipientDetails : undefined} targetMapLocation={origin || mapCenter} /> 
                <Button type="button" onClick={initializeNewJourneyPlan} className="mt-4 w-full" variant="outline" leftIcon={<Icon path={ICON_PATHS.PROJECT_PLAN} className="w-5 h-5"/>}>
                    Plan a Multi-Stop Journey Instead
                </Button>
            </> 
        )} 
      </div>
      <SelectionInfoPanel item={selectedMapItem} isOpen={isSelectionInfoPanelOpen} onClose={closeSelectionInfoPanel} onContactProvider={(providerId) => addToast(`Contacting provider ${providerId} (mock action)`, "info")} />
    </div>
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 active-requests-section"> <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200 mb-4">Your Requests History</h2> <div className="space-y-4 min-h-[100px]"> {activeRequests.length === 0 ? ( <p className="text-gray-500 dark:text-gray-400">No requests yet. Create one using the panel!</p> ) : ( activeRequests.map(req => ( <div key={req.id} className={`bg-white dark:bg-gray-800 p-4 shadow rounded-lg border-l-4 ${getStatusColor(req.status)} hover:shadow-md dark:hover:shadow-gray-700 transition-shadow`}> <div className="flex justify-between items-start"> <h3 className="font-semibold text-gray-800 dark:text-gray-100">{req.textInput || req.aiAnalysisSummary || `Request ID: ${req.id}`}</h3> {req.suggestedPrice !== undefined && <div className="text-right"> <span className="text-lg font-bold text-green-600 dark:text-green-400">${req.suggestedPrice.toFixed(2)}</span> {refinedPrices[req.id]?.price && <span className="block text-xs text-blue-500 dark:text-blue-400">(Refined: ${refinedPrices[req.id]?.price?.toFixed(2)})</span>} </div> } </div> <p className="text-sm text-gray-600 dark:text-gray-400">Type: {req.type || 'N/A'} | Status: <span className={`font-medium`}>{formatStatusText(req.status)}</span></p> <p className="text-sm text-gray-500 dark:text-gray-500">Created: {new Date(req.creationDate).toLocaleDateString()}</p> {req.assignedProviderName && <p className="text-sm text-gray-600 dark:text-gray-400">Provider: <span className="font-medium">{req.assignedProviderName}</span> {req.providerId && <Button variant="ghost" size="sm" className="ml-1 p-0 h-auto text-xs text-blue-500 dark:text-blue-400" onClick={() => handleViewProviderProfile(req.providerId!)}>(View Profile)</Button>}</p>} {req.status !== RequestStatus.CANCELLED && req.status !== RequestStatus.COMPLETED && ( <div className="my-3"> <RequestStatusTimeline currentStatus={req.status} /> </div> )} <div className="mt-3 flex flex-wrap gap-2 justify-end items-center"> {req.type && req.aiAnalysisSummary && req.status === RequestStatus.PENDING && ( <Button size="sm" variant="ghost" onClick={() => handleGetRefinedPrice(req)} isLoading={refinedPrices[req.id]?.loading} disabled={refinedPrices[req.id]?.loading} className="dark:text-blue-300 dark:hover:bg-gray-700"> Get Refined Price </Button> )} {(req.status === RequestStatus.PENDING || req.status === RequestStatus.AWAITING_ACCEPTANCE) && req.bids && req.bids.length > 0 && ( <Button variant="primary" size="sm" onClick={() => openViewBidsModal(req)}> View Bids ({req.bids.length}) </Button> )} {req.status === RequestStatus.PENDING_PAYMENT && ( <Button variant="primary" size="sm" onClick={() => openPaymentModal(req)} leftIcon={<Icon path={ICON_PATHS.CREDIT_CARD} className="w-4 h-4"/>}> Make Payment </Button> )} {(req.status === RequestStatus.PENDING || req.status === RequestStatus.AWAITING_ACCEPTANCE || req.status === RequestStatus.PROVIDER_ASSIGNED) && ( <Button variant="danger" size="sm" onClick={() => handleCancelRequest(req.id)} leftIcon={<Icon path={ICON_PATHS.X_CIRCLE} className="w-4 h-4"/>}> Cancel Request </Button> )} {(req.status === RequestStatus.SERVICE_IN_PROGRESS || req.status === RequestStatus.PENDING_PAYMENT || req.status === RequestStatus.COMPLETED) && !req.disputeDetails && ( <Button variant="ghost" size="sm" onClick={() => openReportIssueModal(req)} className="text-red-600 dark:text-red-400 border-red-500 hover:bg-red-50 dark:hover:bg-red-700"> <Icon path={ICON_PATHS.FLAG} className="w-4 h-4 mr-1"/> Report Issue </Button> )} {req.providerId && (req.status === RequestStatus.PROVIDER_ASSIGNED || req.status === RequestStatus.EN_ROUTE || req.status === RequestStatus.SERVICE_IN_PROGRESS) && ( <Button size="sm" variant="ghost" onClick={() => handleOpenChat(req)} className="text-teal-600 dark:text-teal-400 border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-700"> <Icon path={ICON_PATHS.CHAT_BUBBLE_LEFT_RIGHT} className="w-4 h-4 mr-1"/> Chat </Button> )} </div> {req.review && ( <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700"> <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-200">Your Review:</h4> <StarRating rating={req.review.rating} readOnly size="sm" /> <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 italic">"{req.review.text}"</p> </div> )} {req.status === RequestStatus.COMPLETED && !req.review && !req.disputeDetails && ( <div className="mt-3 text-right"> <Button variant="primary" size="sm" onClick={() => openReviewModal(req)}> Leave a Review </Button> </div> )} </div> )))} </div> </div>
    {requestToReview && ( <LeaveReviewModal isOpen={isReviewModalOpen} onClose={() => setIsReviewModalOpen(false)} onSubmitReview={handleReviewSubmit} requestSummary={requestToReview.textInput || requestToReview.aiAnalysisSummary || `Request ID: ${requestToReview.id}`} /> )}
    {requestForBids && ( <ViewBidsModal isOpen={isViewBidsModalOpen} onClose={() => setIsViewBidsModalOpen(false)} request={requestForBids} onAcceptBid={handleAcceptBid} onViewProviderProfile={handleViewProviderProfile} /> )}
    {providerToView && <ProviderProfileViewModal isOpen={isProviderProfileModalOpen} onClose={() => setIsProviderProfileModalOpen(false)} provider={providerToView} />}
    {requestToReport && ( <ReportIssueModal isOpen={isReportIssueModalOpen} onClose={() => setIsReportIssueModalOpen(false)} onSubmitReport={handleReportIssueSubmit} requestSummary={requestToReport.textInput || requestToReport.aiAnalysisSummary || `Request ID: ${requestToReport.id}`} /> )}
    {requestForPayment && ( <PaymentModal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} onPaymentSuccess={handlePaymentSuccess} requestAmount={requestForPayment.suggestedPrice || 0} requestSummary={requestForPayment.textInput || requestForPayment.aiAnalysisSummary || `Request ID: ${requestForPayment.id}`} /> )}
    {currentChatRequest && user && ( <ChatModal isOpen={isChatModalOpen} onClose={() => setIsChatModalOpen(false)} requestId={currentChatRequest.id} currentUser={user} otherPartyName={currentChatRequest.assignedProviderName || `Provider (ID: ${currentChatRequest.providerId?.substring(0,6)}...)`} initialMessages={taskService.getChatMessages(currentChatRequest.id)} onSendMessage={handleSendMessage} /> )}
    {isStopActionModalOpen && currentStopIdForAction && currentActionType && (
        <ConfigureStopActionModal
            isOpen={isStopActionModalOpen}
            onClose={() => setIsStopActionModalOpen(false)}
            stopId={currentStopIdForAction}
            actionType={currentActionType}
            onSaveAction={handleSaveStopAction}
            existingAction={existingActionToEdit}
        />
    )}
    <ContextualHelpPanel isOpen={isHelpPanelOpen} onClose={() => setIsHelpPanelOpen(false)} pageKey="requester-portal" />
    <OnboardingTour tourKey="onboardingTourShown_requester_map_v3" steps={onboardingSteps} isOpen={isOnboardingOpen} onClose={() => { setIsOnboardingOpen(false); localStorage.setItem('onboardingTourShown_requester_map_v3', 'true'); }}/>
    <Button onClick={() => setIsRequestPanelOpen(true)} variant="ghost" className={`fixed bottom-6 left-6 p-3 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 z-50 transition-opacity duration-300 ${isRequestPanelOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`} aria-label="Open Request Panel"><Icon path={ICON_PATHS.PLUS_CIRCLE} className="w-6 h-6" /></Button>
    <Button onClick={() => setIsHelpPanelOpen(true)} variant="ghost" className="fixed bottom-6 right-6 p-3 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 z-50" aria-label="Help"><Icon path={ICON_PATHS.QUESTION_MARK_CIRCLE} className="w-6 h-6" /></Button>
    </>
  );
};

export default RequesterPortalPage;