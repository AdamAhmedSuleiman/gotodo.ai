// src/types.ts

export interface BlockedTimeSlot {
  id: string;
  title?: string;
  startDate: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD, for multi-day all-day events
  startTime?: string; // HH:MM, if not allDay
  endTime?: string;   // HH:MM, if not allDay
  isAllDay: boolean;
  recurring: 'none' | 'weekly_on_this_day' | 'monthly_on_this_date' | 'every_weekday' | 'every_weekend_day';
  notes?: string;
}

export enum UserRole {
  REQUESTER = "requester",
  PROVIDER = "provider",
  ADMIN = "admin"
}

export type Theme = 'light' | 'dark';

export interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

export interface NotificationPreferences {
  emailForNewBids: boolean;
  pushForStatusUpdates: boolean;
  promotionalOffers: boolean;
  platformAnnouncements: boolean;
}

export type DocumentStatus = 'not_uploaded' | 'pending_review' | 'verified' | 'rejected';
export interface ProviderDocument {
  id: string;
  type: 'drivers_license' | 'vehicle_registration' | 'vehicle_insurance' | 'business_license' | 'background_check' | 'other';
  customTypeName?: string;
  status: DocumentStatus;
  fileName?: string;
  fileUrl?: string;
  uploadedAt?: string; // ISO Date string
  verifiedAt?: string; // ISO Date string
  expiresAt?: string;  // ISO Date string
  rejectionReason?: string;
}

export interface PayoutAccount {
  id: string;
  type: 'bank_account'; // Could expand to PayPal, etc.
  accountNickname?: string;
  isPrimary: boolean;
  // Mock fields for bank account
  mockBankName?: string;
  mockAccountNumberLast4?: string;
  mockRoutingNumberValid?: boolean; // Simulates validation
  addedAt: string; // ISO Date string
}

export interface PayoutHistoryEntry {
  id: string;
  date: string; // ISO Date string
  amount: number;
  status: 'processing' | 'paid' | 'failed';
  destination: string; // e.g., "Bank Account ending in ...1234"
}

export interface DailyRoutineRouteSlot {
  days: ('Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun')[];
  time: string; // HH:MM format
  isReturnTrip?: boolean; // If this specific slot is a return trip
}
export interface DailyRoutineRoute {
  id: string;
  providerId: string;
  routeName: string; // e.g., "Morning School Run", "Evening Commute"
  origin: GeoLocation;
  destination: GeoLocation;
  intermediateStops?: GeoLocation[];
  isOptimizedByAI?: boolean; // Flag if AI has optimized intermediate stops
  schedule: DailyRoutineRouteSlot[]; // Allows for multiple times/days for the same route
  availableForSharing: boolean; // Can other users join or send items along?
  allowedDeviationKm?: number; // If shared, how far off-route can it go?
  notes?: string;
}

export interface HunterModeSettings {
  isEnabled: boolean;
  maxDistanceKm?: number;
  preferredServiceTypes?: ServiceType[];
  minRequestPrice?: number;
  minRequesterRating?: number; 
  keywords?: string; 
}


export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
  faceIdRegistered: boolean;
  linkedinProfileUrl?: string;
  registrationDate?: string;
  lastLogin?: string;
  phone?: string;
  notificationPreferences?: NotificationPreferences;
  status?: 'active' | 'suspended' | 'pending_verification';

  requesterRatings?: RequesterRating[];
  averageRating: number; // Made non-optional

  // Provider specific fields
  providerDocuments?: ProviderDocument[];
  payoutAccounts?: PayoutAccount[];
  payoutHistory?: PayoutHistoryEntry[];
  mockBalance?: number;
  workDestination?: GeoLocation | null;
  dailyRoutineRoutes?: DailyRoutineRoute[];
  hunterModeSettings?: HunterModeSettings;
  skills?: string[];
  equipment?: string[];
  detailedReviews?: Review[];
  badges?: string[];
  verificationLevel?: 'basic' | 'plus' | 'pro';
  priceRange?: 'low' | 'medium' | 'high';
  availabilitySlots?: ProviderAvailabilitySlot[];
  blockedTimeSlots?: BlockedTimeSlot[];
  bio?: string;
  is2FAEnabledMock?: boolean;
  operationalHours?: string;
  tasksCompletedCount?: number;
  memberSinceDate?: string;
  isVerified?: boolean;
  specialties?: string[];
  location?: GeoLocation;
  serviceTypes?: ServiceType[]; // Service types they offer
  transportationMode?: TransportationMode; // Primary mode of transport
  vehiclesOffered?: Vehicle[];
  productsOffered?: Product[];
  servicesOffered?: ProfessionalService[];
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (name: string, email: string, pass: string, role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updatedFields: Partial<User>) => void;
  setUserRole: (role: UserRole) => void;
}


export enum ServiceType {
  RIDES = "RIDES",
  SERVICES = "SERVICES",
  PRODUCTS = "PRODUCTS",
  TASKS = "TASKS",

  RIDE_DELIVERY = "ride_delivery",
  PRODUCT_SALE = "product_sale",
  PROFESSIONAL_SERVICE = "professional_service",
  GENERAL_HELP = "general_help",
  INFORMATION_REQUEST = "information_request",
  EVENT_PLANNING = "event_planning",
  LOGISTICS = "logistics",

  PLUMBING = "plumbing",
  ELECTRICAL = "electrical",
  FURNITURE_ASSEMBLY = "furniture_assembly",
  APPLIANCE_REPAIR = "appliance_repair",
  CLEANING = "cleaning",
  LANDSCAPING = "landscaping",

  UNKNOWN = "unknown",
}

export enum TransportationMode {
  CAR_SEDAN = "car_sedan",
  CAR_SUV = "car_suv",
  CAR_VAN = "car_van",
  CAR_TRUCK_LIGHT = "car_truck_light",
  CAR_TRUCK_HEAVY = "car_truck_heavy",
  MOTORCYCLE = "motorcycle",
  BUS = "bus",
  SPECIALIZED_LAND_VEHICLE = "specialized_land_vehicle",
  BOAT = "boat",
  FERRY = "ferry",
  PLANE_CARGO = "plane_cargo",
  PLANE_PASSENGER = "plane_passenger",
  HELICOPTER = "helicopter",
  OTHER = "other",
  NONE = "none"
}

export interface Vehicle {
  id: string;
  providerId: string;
  mode: TransportationMode;
  make: string;
  model: string;
  year?: number;
  color?: string;
  licensePlate?: string;
  capacity?: string;
  photos: string[];
  specialEquipment?: string[];
  dimensions?: { lengthMeters?: number; widthMeters?: number; heightMeters?: number };
  payloadCapacityKg?: number;
  numberOfSeats?: number;
  cargoHoldType?: 'open' | 'closed' | 'refrigerated' | 'specialized';
  isWheelchairAccessible?: boolean;
  features?: string[];
}

export enum MeasuringUnit {
    KILOGRAM = "kg", POUND = "lbs", METER = "m", FOOT = "ft",
    LITER = "L", GALLON = "gal", PIECES = "pcs", PACK = "pack",
    PALLET = "pallet", BOX = "box", SESSION = "session", HOUR = "hour",
    TASK = "task", OTHER = "other"
}

export interface ProductStockHistoryEntry {
  date: string; // ISO date string
  change: number; // Positive for stock in, negative for stock out
  reason: string; // e.g., "Sale", "New Shipment", "Correction"
  newStockLevel: number;
}
export interface Product {
  id: string;
  providerId: string;
  name: string;
  description: string;
  photos: string[];
  stock: number;
  price: number;
  category?: string;
  barcode?: string;
  qrCode?: string;
  measuringUnit?: MeasuringUnit | string;
  variantsText?: string;
  reorderLevel?: number;
  stockHistory?: ProductStockHistoryEntry[];
  websiteUrl?: string;
}

export interface ProfessionalService {
  id: string;
  providerId: string;
  name: string;
  description: string;
  qualifications?: string;
  rateType: "hourly" | "fixed" | "quote_based";
  rate: number;
  serviceArea?: string;
  portfolioUrls?: string[];
  tagsOrSkills?: string[];
}

export interface GeoLocation {
  lat: number;
  lng: number;
  address?: string;
}

export type MockProviderProfile = User & {
  location: GeoLocation;
  serviceTypes: ServiceType[];
  productsOffered?: Product[];
  servicesOffered?: ProfessionalService[];
  vehiclesOffered?: Vehicle[];
};


export enum RequestStatus {
  PENDING = "pending",
  AWAITING_ACCEPTANCE = "awaiting_acceptance",
  PROVIDER_ASSIGNED = "provider_assigned",
  EN_ROUTE = "en_route",
  SERVICE_IN_PROGRESS = "service_in_progress",
  PENDING_PAYMENT = "pending_payment",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
  DISPUTED = "disputed",
  AWAITING_COUNTER_OFFER_RESPONSE = "awaiting_counter_offer_response",
  MODERATION_REVIEW = "moderation_review",
  RESOLVED = "resolved",
}

export interface Review {
  rating: number;
  text: string;
  date: string;
  reviewerName?: string;
  reviewerId?: string;
  reviewTitle?: string;
  aspectRatings?: {
    quality?: number;
    communication?: number;
    timeliness?: number;
  };
}
export interface RequesterRating {
  rating: number;
  comment?: string;
  date: string;
  providerId: string;
  providerName?: string;
}

export interface MockProviderBid {
  providerId: string;
  providerName: string;
  providerAvatarUrl?: string;
  bidAmount: number;
  message: string;
  timestamp: string;
  counterOfferDetails?: Partial<RequestData>;
}

export interface DisputeDetails {
  reason: string;
  description: string;
  reportedDate: string;
  resolutionSummary?: string;
  resolvedDate?: string;
}

export interface RecipientDetails {
  name?: string;
  contact?: string;
  address?: GeoLocation;
  addressString?: string;
  notes?: string;
}

export interface ChatMessage {
  id: string;
  requestId: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  isAIMessage?: boolean;
}

export interface RequestData {
  id: string;
  requesterId: string;
  providerId?: string;
  assignedProviderName?: string;
  type: ServiceType;
  textInput?: string;
  imageB64Data?: string;
  imageUrl?: string;
  audioInputUrl?: string;
  videoInputUrl?: string;
  hasAudio?: boolean;
  hasVideo?: boolean;
  numUploadedMedia?: number;
  origin?: GeoLocation;
  destination?: GeoLocation;
  targetMapLocation?: GeoLocation;
  requestFor: 'self' | 'someone_else';
  recipientDetails?: RecipientDetails;
  status: RequestStatus;
  creationDate: string;
  completionDate?: string;
  aiAnalysisSummary?: string;
  aiExtractedEntities?: Record<string, any>;
  suggestedPrice?: number;
  finalPrice?: number;
  review?: Review;
  requesterRatingMock?: number;
  disputeDetails?: DisputeDetails;
  bids?: MockProviderBid[];
  selectedTransportationMode?: TransportationMode;
  aiSuggestedTransportationModes?: TransportationMode[];
  earnedAmount?: number;
  chatMessages?: ChatMessage[];
  isChainedRequest?: boolean;
  linkedRequestId?: string;
  journeyPlanId?: string;
  journeyStopId?: string;
  journeyActionId?: string;
  taskProjectId?: string;
  taskSubItemId?: string;
  taskContext?: string;
  isHuntedRequest?: boolean;
  providerLastLocation?: GeoLocation | null;
}

export interface AIAnalysisResult {
  type: ServiceType;
  summary: string;
  entities: Record<string, any>;
  priceSuggestion?: number;
  aiSuggestedTransportationModes?: TransportationMode[];
}

export interface AISuggestionResponse {
  textResponse: string;
}

export interface MapMarkerData {
  id: string;
  position: google.maps.LatLngLiteral;
  title?: string;
  type: 'origin' | 'destination' | 'provider' | 'product' | 'recipient' | 'generic' | 'current_provider_location' | 'service_area' | 'journey_stop';
  data?: any;
}

export interface MapDisplayProps {
  center: google.maps.LatLngLiteral;
  zoom: number;
  className?: string;
  markers?: MapMarkerData[];
  onMapClick?: (location: google.maps.LatLngLiteral) => void;
  onMarkerClick?: (markerData: MapMarkerData) => void;
  route?: { origin: GeoLocation; destination: GeoLocation };
  journeyPath?: GeoLocation[];
}

export interface EarningDataPoint {
  date: string;
  earnings: number;
}

export interface NotificationItem {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning' | 'new_request' | 'bid_received' | 'task_update' | 'payment_update' | 'chat_message';
  timestamp: string;
  read: boolean;
  link?: string;
  relatedRequestId?: string;
}

export interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  addNotification: (message: string, type: NotificationItem['type'], link?: string, relatedRequestId?: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAllNotifications: () => void;
}

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

export interface ToastContextType {
  toasts: ToastMessage[];
  addToast: (message: string, type: ToastMessage['type']) => void;
  removeToast: (id: string) => void;
}

export interface SplashMessage {
    id: number;
    text: string;
    delay: number;
}

export interface AdminUserView extends User {
  // Inherits all from User
}

export interface FlaggedRequestView extends RequestData {
    flaggedBy: string; // User ID or 'System'
    reason: string;
    flagDate: string; // ISO date string
    moderationStatus?: 'pending_review' | 'resolved' | 'escalated';
    moderationNotes?: string;
}

export interface AdminFlaggedRequestDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: FlaggedRequestView | null;
  onModerateRequest: (requestId: string, action: 'resolve' | 'warn_user' | 'ban_user' | 'remove_content' | 'dismiss_flag', notes?: string) => void;
}

export interface AdminUserDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: AdminUserView | null;
  onToggleUserStatus: (userId: string, currentStatus?: 'active' | 'suspended' | 'pending_verification', forceSuspend?: boolean) => void;
}


export interface PaymentDetails {
  paymentMethod: 'credit_card' | 'paypal' | 'gotodo_balance'; // Example methods
  cardNumber?: string;
  cardExpiry?: string; // MM/YY
  cardCVC?: string;
  billingZip?: string;
  country?: string;
}

export interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: () => void;
  requestAmount: number;
  requestSummary: string;
}

export interface LeaveReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitReview: (rating: number, text: string) => void;
  requestSummary: string;
}

export interface ProviderProfileViewModalProps {
    isOpen: boolean;
    onClose: () => void;
    provider: MockProviderProfile | null;
}

export interface ViewBidsModalProps {
    isOpen: boolean;
    onClose: () => void;
    request: RequestData;
    onAcceptBid: (bid: MockProviderBid) => void;
    onViewProviderProfile: (providerId: string) => void;
}

export interface ReportIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitReport: (reason: string, description: string) => void;
  requestSummary: string;
}

export interface AudioInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAnalysisComplete: (analysis: AIAnalysisResult, audioFileName?: string) => void;
}

export interface VideoInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuggestionReceived: (suggestion: string, videoFileName?: string) => void;
}

export interface FaceIDSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSetupComplete: () => void;
  userName: string;
}

export interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  size?: 'sm' | 'md' | 'lg';
  readOnly?: boolean;
  className?: string;
}

export interface ContextualHelpPanelProps {
  isOpen: boolean;
  onClose: () => void;
  pageKey: 'home' | 'requester-portal' | 'provider-portal' | 'admin-portal' | 'settings-page' | 'task-portal';
  position?: 'bottom-right' | 'bottom-left';
}
export interface OnboardingStep {
  elementQuerySelector: string;
  title: string;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}
export interface OnboardingTourProps {
  tourKey: string; // Unique key for localStorage to track if tour was shown
  steps: OnboardingStep[];
  isOpen: boolean;
  onClose: () => void;
}

export interface SelectionInfoPanelProps {
  item: MapMarkerData | null;
  isOpen: boolean;
  onClose: () => void;
  onContactProvider?: (providerId: string) => void; // If item is a provider
  onViewProduct?: (productId: string, providerId: string) => void; // If item is a product from a provider
}

export interface GroundingChunk {
    web?: { uri: string; title: string };
    retrievedContext?: { uri: string; title: string };
}
export interface AISmartReplyResponse {
  replies?: string[];
  translation?: string;
  error?: string;
}

export interface ManageServicesModalProps {
  isOpen: boolean;
  onClose: () => void;
  services: ProfessionalService[];
  onAddService: (service: Omit<ProfessionalService, 'id' | 'providerId'>) => void;
  onUpdateService?: (service: ProfessionalService) => void; // Optional for now
  onDeleteService?: (serviceId: string) => void; // Optional for now
}
export interface ManageProductsModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onAddProduct: (product: Omit<Product, 'id' | 'providerId'>) => void;
  onOpenScanModal?: () => void; 
}

export interface ManageVehiclesModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicles: Vehicle[];
  onAddVehicle: (vehicle: Omit<Vehicle, 'id' | 'providerId'>) => void;
}


export interface ProviderAvailabilitySlot {
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  isAvailable: boolean;
  slots: { startTime: string; endTime: string }[]; 
}


export interface ManageAvailabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  availability: ProviderAvailabilitySlot[];
  onSaveAvailability: (availability: ProviderAvailabilitySlot[]) => void;
  blockedTimeSlots?: BlockedTimeSlot[];
  onAddBlockedTimeSlot?: (slot: Omit<BlockedTimeSlot, 'id'>) => void;
  onDeleteBlockedTimeSlot?: (slotId: string) => void;
}


export interface ProviderEarningsHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  completedTasks: RequestData[];
  totalEarnings?: number;
  totalPayouts?: number;
  currentBalance?: number;
}

export interface RateRequesterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitRating: (rating: number, comment?: string) => void;
  requesterName: string;
  requestSummary: string;
}

export interface HeatmapTile {
  id: string;      // Unique identifier for the tile, e.g., "cell-row-col"
  intensity: number; // Value from 0 (no demand) to 1 (highest demand)
  // Potentially add coordinates or geo-bounds if it were a real map
}

export interface HeatmapPlaceholderProps {
  tiles: HeatmapTile[][]; // 2D array representing the grid
}


export interface ManageDocumentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  documents: ProviderDocument[];
  onAddDocument: (documentData: Omit<ProviderDocument, 'id' | 'status' | 'uploadedAt' | 'verifiedAt' | 'fileUrl'>, file: File) => void;
  onDeleteDocument: (documentId: string) => void;
}

export interface PayoutSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    payoutAccounts: PayoutAccount[];
    payoutHistory: PayoutHistoryEntry[];
    currentBalance: number;
    onAddAccount: (accountData: Omit<PayoutAccount, 'id'|'addedAt'|'isPrimary'>) => void;
    onSetPrimaryAccount: (accountId: string) => void;
    onDeleteAccount: (accountId: string) => void;
    onRequestPayout: (amount: number, accountId: string) => void;
}

export interface SetWorkDestinationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSetDestination: (address: string) => void; // Or GeoLocation if geocoding happens in modal
  currentDestination: GeoLocation | null;
}

export interface SavedPlace {
  id: string;
  name: string;
  location: GeoLocation;
}

export interface SavedMember {
  id: string;
  name: string; // User-defined nickname for this member
  details: RecipientDetails; // Actual recipient information
}


export interface AddSavedPlaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (placeData: Omit<SavedPlace, 'id'>) => void;
}

export interface AddSavedMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (memberData: Omit<SavedMember, 'id'>) => void;
}

export interface ProductScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductDetailsReceived: (details: Partial<Product>) => void;
}

export interface ManageDailyRoutesModalProps {
  isOpen: boolean;
  onClose: () => void;
  routes: DailyRoutineRoute[];
  onSaveRoute: (route: DailyRoutineRoute) => void;
  onDeleteRoute: (routeId: string) => void;
}

export interface HunterModeSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentSettings: HunterModeSettings;
    onSaveSettings: (settings: HunterModeSettings) => void;
}

export interface MakeOfferModalProps {
    isOpen: boolean;
    onClose: () => void;
    request: RequestData;
    onSubmitOffer: (offerAmount: number, message: string) => void;
}

export enum TaskProjectStatus {
  DRAFT = "draft",
  PLANNING = "planning",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  ON_HOLD = "on_hold",
  CANCELLED = "cancelled"
}

export interface TaskSubItem {
  id: string;
  name: string;
  type: 'product' | 'service' | 'logistics'; // Type of item
  description?: string;
  quantity?: number;
  unit?: MeasuringUnit | string; // e.g., pcs, hours, kg
  estimatedCost?: number;
  actualCost?: number;
  status: 'pending' | 'sourced' | 'request_created' | 'in_progress' | 'completed' | 'cancelled';
  linkedRequestId?: string; // If a service request was created for this
  dependsOn?: string[]; // IDs of other TaskSubItems this depends on
  assignedResources?: string[]; // Names or IDs of assigned team members or equipment
}

export interface TaskMilestone {
  id: string;
  name: string;
  date: string; // Target date in YYYY-MM-DD format
  completed: boolean;
  description?: string;
}

export interface TaskAttachment {
    id: string;
    name: string;
    type: string; // MIME type or general file type
    size: number; // in bytes
    url?: string;  // If stored in cloud
    mockUrl?: string; // For local blob previews
}

export interface TaskTeamMember {
    userId: string; // Could be a full User object or just ID/name
    name: string;
    roleInTask: string; // e.g., "Lead Designer", "Project Manager", "Contractor"
    avatarUrl?: string;
}

export interface TaskComment {
    id: string;
    projectId: string; // Link back to the TaskProject
    authorId: string;
    authorName: string; // Denormalized for display
    authorAvatarUrl?: string; // Denormalized for display
    text: string;
    timestamp: string; // ISO Date string
    replies?: TaskComment[]; // For threaded comments
}
export interface ProjectRisk {
    id: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
    mitigationSuggestion?: string;
    status?: 'open' | 'addressed' | 'closed';
}
export interface AICriticalPathInfo {
    pathItemIds: string[]; // Ordered list of TaskSubItem IDs on the critical path
    analysisNotes: string; // AI's reasoning or summary
}

export interface TaskProject {
  id: string;
  creatorId: string;
  title: string;
  description: string;
  status: TaskProjectStatus;
  creationDate: string; // ISO date string
  startDate?: string; // ISO date string
  endDate?: string;   // ISO date string
  budget?: number;
  totalSpent?: number;
  primaryLocation?: GeoLocation;
  itemsNeeded?: TaskSubItem[];
  milestones?: TaskMilestone[];
  attachments?: TaskAttachment[];
  team?: TaskTeamMember[]; // List of users involved
  aiIdentifiedRisks?: ProjectRisk[];
  aiCriticalPathInfo?: AICriticalPathInfo;
  templateName?: string; // Name of the template used, if any
}

export interface TaskSubItemFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: TaskSubItem) => void;
  initialData?: TaskSubItem;
  projectId: string; // To know which project this sub-item belongs to
  allItemsInProject?: TaskSubItem[]; // For dependency selection
  teamMembers?: TaskTeamMember[]; // For resource assignment
}

export interface AISummaryExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    project: TaskProject | null; // The project to summarize
}

export type StopActionType =
  | 'pickup_person'
  | 'dropoff_person'
  | 'pickup_item'
  | 'dropoff_item'
  | 'assign_task'
  | 'wait'
  | 'other';

export interface PickupPersonActionDetails {
  passengerCount?: number;
  luggage?: string;
  pickupFor?: 'myself' | 'someone_else';
  targetNameOrId?: string;
  targetMobile?: string;
  notes?: string;
  setDateTime?: string; // ISO string or simple time for within the day
  transportationType?: string; // e.g., "Sedan", "Van", "Wheelchair Accessible"
  vehicleSubType?: string; // e.g., "XL", "Premium"
  transportationDetails?: string; // Further specifics
}

export interface PickupItemActionDetails {
  productNameOrCode?: string;
  itemDescription?: string;
  quantity?: number;
  unit?: MeasuringUnit | string;
  pickupFrom?: 'myself' | 'store_or_business' | 'someone_else';
  companyName?: string;
  nameOrUserId?: string; // Name of person or their ID if known user
  mobile?: string;
  instructionsToDriver?: string;
  setDateTime?: string;
}

export interface DropoffPersonActionDetails {
  passengerSelection?: string; // Which passenger from a pickup action, or "All"
  luggage?: string;
  dropoffTo?: 'myself' | 'someone_else';
  targetNameOrId?: string;
  notes?: string;
  setDateTime?: string;
}

export interface DropoffItemActionDetails {
  itemSelection?: string; // Which item from a pickup action, or "All"
  itemDescription?: string; // If not tied to a specific pickup
  quantity?: number;
  unit?: MeasuringUnit | string;
  dropoffTo?: 'myself' | 'someone_else';
  targetNameOrId?: string;
  companyName?: string;
  mobile?: string;
  notes?: string;
  setDateTime?: string;
}


export interface AssignTaskActionDetails {
  taskDetails: string;
  assignTo?: 'myself' | 'someone_else'; // 'myself' means provider does it, 'someone_else' for delegation
  selectedPersonId?: string; // If delegating to a known team member/contact
  requiredSkills?: string[];
  toolsOrEquipment?: string[];
  notes?: string;
}

export interface WaitActionDetails {
  durationMinutes: number;
  reason?: string;
}

export interface OtherActionDetails {
  description: string;
  notes?: string;
}

export interface JourneyAction {
  id: string;
  type: StopActionType;
  details: PickupPersonActionDetails | DropoffPersonActionDetails | PickupItemActionDetails | DropoffItemActionDetails | AssignTaskActionDetails | WaitActionDetails | OtherActionDetails | Record<string, any>; // Use Record for flexibility
  status: 'pending' | 'configured' | 'in_progress' | 'completed' | 'cancelled';
  linkedRequestId?: string; // If this action results in a service request
}

export interface JourneyStop {
  id: string;
  name: string; // e.g., "Stop 1", "Client Site", "Home"
  addressInput: string; // Raw user input
  location?: GeoLocation; // Geocoded location
  sequence: number;
  actions: JourneyAction[];
  estimatedArrivalTime?: string; // ISO or simple time
  estimatedDepartureTime?: string; // ISO or simple time
  notes?: string;
}

export interface JourneyPlan {
  id: string;
  requesterId: string;
  title: string;
  description?: string;
  status: 'draft' | 'planned' | 'in_progress' | 'completed' | 'cancelled';
  creationDate: string; // ISO Date string
  stops: JourneyStop[];
  totalEstimatedDistanceKm?: number;
  totalEstimatedDurationMinutes?: number;
}

export interface ConfigureStopActionModalProps {
    isOpen: boolean;
    onClose: () => void;
    stopId: string;
    actionType: StopActionType;
    onSaveAction: (stopId: string, action: JourneyAction) => void;
    existingAction?: JourneyAction;
}

export interface SystemConfiguration {
  commissionRatePercent: number;
  minimumCommissionUSD: number;
  serviceCategories: string[];
  notificationTemplates: Record<string, { subject: string; body: string }>; // Key: template name
  featureFlags?: Record<string, boolean>;
}

export interface PlatformAnalyticsData {
  dailyNewUsers: { date: string; count: number }[];
  requestsByServiceType: { type: ServiceType | string; count: number }[]; // Allow string for flexibility
  platformRevenue: { date: string; revenue: number; commission: number }[];
  apiHealth: { timestamp: string; avgResponseTimeMs: number; errorRatePercent: number };
}

export interface TwoFactorAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSetupComplete: (mockBackupCodes: string[]) => void; // Callback with mock backup codes
}

export interface MockGanttItem {
  id: string;
  name: string;
  start: number; // Start day/offset
  duration: number; // Duration in days/units
  type: 'task' | 'milestone';
  color: string; // Tailwind color class for the bar
}

export interface GanttChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: TaskSubItem[];
  milestones: TaskMilestone[];
  projectStartDate?: string; // YYYY-MM-DD
}

export interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  requestId: string;
  currentUser: User; // User object for the current user
  otherPartyName: string; // Display name of the other chat participant
  initialMessages: ChatMessage[];
  onSendMessage: (requestId: string, message: ChatMessage) => void;
}

export interface ChangelogEntry {
  version: string;
  date: string; // ISO date string like "YYYY-MM-DD"
  description: string;
  changes: string[];
}