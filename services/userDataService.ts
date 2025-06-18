// src/services/userDataService.ts
import { SavedPlace, SavedMember, GeoLocation, RecipientDetails, DailyRoutineRoute, HunterModeSettings, ProviderAvailabilitySlot, BlockedTimeSlot, PayoutAccount, PayoutHistoryEntry, Product, ProductStockHistoryEntry } from '../types.js';

const API_BASE_URL = '/api'; // Conceptual API base URL

// Helper for API calls
async function fetchApi<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      // Authorization header
      ...options.headers,
    },
    ...options,
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Network response was not ok and error JSON parsing failed' }));
    throw new Error(errorData.message || `API request failed with status ${response.status}`);
  }
  return response.json() as Promise<T>;
}

// --- Saved Places ---
export const getSavedPlaces = async (userId: string): Promise<SavedPlace[]> => {
  // return fetchApi<SavedPlace[]>(`${API_BASE_URL}/users/${userId}/saved-places`);
  console.log(`[UserDataService] Mock: Fetching saved places for user ${userId}`);
  const stored = localStorage.getItem(`gotodo_saved_places_${userId}`);
  return stored ? JSON.parse(stored) : [];
};

export const addSavedPlace = async (userId: string, placeData: Omit<SavedPlace, 'id'>): Promise<SavedPlace> => {
  // return fetchApi<SavedPlace>(`${API_BASE_URL}/users/${userId}/saved-places`, {
  //   method: 'POST',
  //   body: JSON.stringify(placeData),
  // });
  console.log(`[UserDataService] Mock: Adding saved place for user ${userId}`, placeData);
  const places = await getSavedPlaces(userId);
  const newPlace: SavedPlace = { ...placeData, id: `place-${Date.now()}` };
  places.push(newPlace);
  localStorage.setItem(`gotodo_saved_places_${userId}`, JSON.stringify(places));
  return newPlace;
};

export const deleteSavedPlace = async (userId: string, placeId: string): Promise<void> => {
  // await fetchApi<void>(`${API_BASE_URL}/users/${userId}/saved-places/${placeId}`, { method: 'DELETE' });
  console.log(`[UserDataService] Mock: Deleting saved place ${placeId} for user ${userId}`);
  let places = await getSavedPlaces(userId);
  places = places.filter(p => p.id !== placeId);
  localStorage.setItem(`gotodo_saved_places_${userId}`, JSON.stringify(places));
};

// --- Saved Members ---
export const getSavedMembers = async (userId: string): Promise<SavedMember[]> => {
  // return fetchApi<SavedMember[]>(`${API_BASE_URL}/users/${userId}/saved-members`);
  console.log(`[UserDataService] Mock: Fetching saved members for user ${userId}`);
  const stored = localStorage.getItem(`gotodo_saved_members_${userId}`);
  return stored ? JSON.parse(stored) : [];
};

export const addSavedMember = async (userId: string, memberData: Omit<SavedMember, 'id'>): Promise<SavedMember> => {
  const payload = {
      ...memberData,
      details: {
          ...memberData.details,
          name: memberData.details?.name || memberData.name,
      }
  };
  // return fetchApi<SavedMember>(`${API_BASE_URL}/users/${userId}/saved-members`, {
  //   method: 'POST',
  //   body: JSON.stringify(payload),
  // });
  console.log(`[UserDataService] Mock: Adding saved member for user ${userId}`, payload);
  const members = await getSavedMembers(userId);
  const newMember: SavedMember = { ...payload, id: `member-${Date.now()}` };
  members.push(newMember);
  localStorage.setItem(`gotodo_saved_members_${userId}`, JSON.stringify(members));
  return newMember;
};

export const deleteSavedMember = async (userId: string, memberId: string): Promise<void> => {
  // await fetchApi<void>(`${API_BASE_URL}/users/${userId}/saved-members/${memberId}`, { method: 'DELETE' });
  console.log(`[UserDataService] Mock: Deleting saved member ${memberId} for user ${userId}`);
  let members = await getSavedMembers(userId);
  members = members.filter(m => m.id !== memberId);
  localStorage.setItem(`gotodo_saved_members_${userId}`, JSON.stringify(members));
};

// --- Provider Work Destination ---
export const saveProviderWorkDestination = async (providerId: string, destination: GeoLocation | null): Promise<void> => {
//   await fetchApi<void>(`${API_BASE_URL}/providers/${providerId}/work-destination`, {
//     method: 'PUT',
//     body: JSON.stringify(destination), // API handles null to clear
//   });
  console.log(`[UserDataService] Mock: Saving work destination for provider ${providerId}`, destination);
  if (destination) {
    localStorage.setItem(`gotodo_provider_work_dest_${providerId}`, JSON.stringify(destination));
  } else {
    localStorage.removeItem(`gotodo_provider_work_dest_${providerId}`);
  }
};

export const getProviderWorkDestination = async (providerId: string): Promise<GeoLocation | null> => {
//   return fetchApi<GeoLocation | null>(`${API_BASE_URL}/providers/${providerId}/work-destination`);
  console.log(`[UserDataService] Mock: Fetching work destination for provider ${providerId}`);
  const stored = localStorage.getItem(`gotodo_provider_work_dest_${providerId}`);
  return stored ? JSON.parse(stored) : null;
};

// --- Daily Routine Routes ---
export const getDailyRoutineRoutes = async (userId: string): Promise<DailyRoutineRoute[]> => {
    // return fetchApi<DailyRoutineRoute[]>(`${API_BASE_URL}/providers/${userId}/daily-routes`);
    console.log(`[UserDataService] Mock: Fetching daily routes for user ${userId}`);
    const stored = localStorage.getItem(`gotodo_provider_daily_routes_${userId}`);
    return stored ? JSON.parse(stored) : [];
};

export const saveDailyRoutineRoute = async (userId: string, route: DailyRoutineRoute): Promise<DailyRoutineRoute> => {
    console.log(`[UserDataService] Mock: Saving daily route "${route.routeName}" for user ${userId}`);
    const routes = await getDailyRoutineRoutes(userId);
    const routeToSave = { ...route, id: route.id.startsWith('route-temp-') ? `route-${Date.now()}` : route.id };
    const existingIndex = routes.findIndex(r => r.id === routeToSave.id);
    if (existingIndex > -1) {
        routes[existingIndex] = routeToSave;
    } else {
        routes.push(routeToSave);
    }
    localStorage.setItem(`gotodo_provider_daily_routes_${userId}`, JSON.stringify(routes));
    return routeToSave;
};

export const deleteDailyRoutineRoute = async (userId: string, routeId: string): Promise<void> => {
    console.log(`[UserDataService] Mock: Deleting daily route ${routeId} for user ${userId}`);
    let routes = await getDailyRoutineRoutes(userId);
    routes = routes.filter(r => r.id !== routeId);
    localStorage.setItem(`gotodo_provider_daily_routes_${userId}`, JSON.stringify(routes));
};

// --- Hunter Mode Settings ---
export const saveHunterModeSettings = async (userId: string, settings: HunterModeSettings): Promise<void> => {
    console.log(`[UserDataService] Mock: Saving hunter mode settings for user ${userId}`, settings);
    localStorage.setItem(`gotodo_hunter_settings_${userId}`, JSON.stringify(settings));
};

export const getHunterModeSettings = async (userId: string): Promise<HunterModeSettings | null> => {
    console.log(`[UserDataService] Mock: Fetching hunter mode settings for user ${userId}`);
    const stored = localStorage.getItem(`gotodo_hunter_settings_${userId}`);
    if (stored) {
        const settings = JSON.parse(stored) as HunterModeSettings;
        return { // Ensure defaults
             isEnabled: settings?.isEnabled || false,
            maxDistanceKm: settings?.maxDistanceKm || 20,
            preferredServiceTypes: Array.isArray(settings?.preferredServiceTypes) ? settings.preferredServiceTypes : [],
            minRequestPrice: settings?.minRequestPrice,
            minRequesterRating: settings?.minRequesterRating,
            keywords: settings?.keywords,
        };
    }
    return { isEnabled: false, maxDistanceKm: 20, preferredServiceTypes: [], minRequestPrice: undefined, minRequesterRating: undefined, keywords: undefined };
};

// --- Provider Availability Slots ---
export const saveProviderAvailabilitySlots = async (userId: string, availability: ProviderAvailabilitySlot[]): Promise<void> => {
  console.log(`[UserDataService] Mock: Saving availability slots for user ${userId}`, availability);
  localStorage.setItem(`gotodo_provider_availability_${userId}`, JSON.stringify(availability));
};

export const getProviderAvailabilitySlots = async (userId: string): Promise<ProviderAvailabilitySlot[]> => {
  console.log(`[UserDataService] Mock: Fetching availability slots for user ${userId}`);
  const stored = localStorage.getItem(`gotodo_provider_availability_${userId}`);
  return stored ? JSON.parse(stored) : [];
};

// --- Blocked Time Slots for Provider Availability ---
export const getProviderBlockedTimeSlots = async (userId: string): Promise<BlockedTimeSlot[]> => {
    console.log(`[UserDataService] Mock: Fetching blocked time slots for user ${userId}`);
    const stored = localStorage.getItem(`gotodo_provider_blocked_slots_${userId}`);
    return stored ? JSON.parse(stored) : [];
};

export const addProviderBlockedTimeSlot = async (userId: string, slotData: Omit<BlockedTimeSlot, 'id'>): Promise<BlockedTimeSlot> => {
    console.log(`[UserDataService] Mock: Adding blocked time slot for user ${userId}`, slotData);
    const slots = await getProviderBlockedTimeSlots(userId);
    const newSlot: BlockedTimeSlot = { ...slotData, id: `block-${Date.now()}` };
    slots.push(newSlot);
    localStorage.setItem(`gotodo_provider_blocked_slots_${userId}`, JSON.stringify(slots));
    return newSlot;
};

export const deleteProviderBlockedTimeSlot = async (userId: string, slotId: string): Promise<void> => {
    console.log(`[UserDataService] Mock: Deleting blocked time slot ${slotId} for user ${userId}`);
    let slots = await getProviderBlockedTimeSlots(userId);
    slots = slots.filter(s => s.id !== slotId);
    localStorage.setItem(`gotodo_provider_blocked_slots_${userId}`, JSON.stringify(slots));
};

// --- Payout Accounts ---
export const getPayoutAccounts = async (userId: string): Promise<PayoutAccount[]> => {
    console.log(`[UserDataService] Mock: Fetching payout accounts for user ${userId}`);
    const stored = localStorage.getItem(`gotodo_payout_accounts_${userId}`);
    return stored ? JSON.parse(stored) : [];
};
export const addPayoutAccount = async (userId: string, accountData: Omit<PayoutAccount, 'id'|'addedAt'>): Promise<PayoutAccount> => {
    console.log(`[UserDataService] Mock: Adding payout account for user ${userId}`, accountData);
    const accounts = await getPayoutAccounts(userId);
    const newAccount: PayoutAccount = { ...accountData, id: `pacc-${Date.now()}`, addedAt: new Date().toISOString() };
    accounts.push(newAccount);
    localStorage.setItem(`gotodo_payout_accounts_${userId}`, JSON.stringify(accounts));
    return newAccount;
};
export const setPrimaryPayoutAccount = async (userId: string, accountId: string): Promise<void> => {
    console.log(`[UserDataService] Mock: Setting primary payout account ${accountId} for user ${userId}`);
    let accounts = await getPayoutAccounts(userId);
    accounts = accounts.map(acc => ({ ...acc, isPrimary: acc.id === accountId }));
    localStorage.setItem(`gotodo_payout_accounts_${userId}`, JSON.stringify(accounts));
};
export const deletePayoutAccount = async (userId: string, accountId: string): Promise<void> => {
    console.log(`[UserDataService] Mock: Deleting payout account ${accountId} for user ${userId}`);
    let accounts = await getPayoutAccounts(userId);
    accounts = accounts.filter(acc => acc.id !== accountId);
    localStorage.setItem(`gotodo_payout_accounts_${userId}`, JSON.stringify(accounts));
};

// --- Payout History ---
export const getPayoutHistory = async (userId: string): Promise<PayoutHistoryEntry[]> => {
    console.log(`[UserDataService] Mock: Fetching payout history for user ${userId}`);
    const stored = localStorage.getItem(`gotodo_payout_history_${userId}`);
    return stored ? JSON.parse(stored) : [];
};
export const requestPayout = async (userId: string, amount: number, accountId: string): Promise<PayoutHistoryEntry> => {
    console.log(`[UserDataService] Mock: Requesting payout of $${amount} to account ${accountId} for user ${userId}`);
    const history = await getPayoutHistory(userId);
    const account = (await getPayoutAccounts(userId)).find(a => a.id === accountId);
    const newEntry: PayoutHistoryEntry = {
        id: `payout-${Date.now()}`,
        date: new Date().toISOString(),
        amount,
        status: 'processing', // Simulate processing
        destination: account?.accountNickname || `Account ...${account?.mockAccountNumberLast4 || '????'}`
    };
    history.unshift(newEntry); // Add to beginning
    localStorage.setItem(`gotodo_payout_history_${userId}`, JSON.stringify(history));
    // Simulate payout completion after a delay
    setTimeout(async () => {
        const updatedHistory = await getPayoutHistory(userId);
        const entryIndex = updatedHistory.findIndex(e => e.id === newEntry.id);
        if (entryIndex > -1) {
            updatedHistory[entryIndex].status = 'paid';
            localStorage.setItem(`gotodo_payout_history_${userId}`, JSON.stringify(updatedHistory));
            console.log(`[UserDataService] Mock: Payout ${newEntry.id} completed.`);
        }
    }, 5000 + Math.random() * 5000);
    return newEntry;
};


// --- Product Stock Management ---
// Product CRUD itself might be in providerService.ts or a dedicated productService.ts
// This file focuses on user-specific data, so product stock updates tied to a provider.
export const updateProductStock = async (userId: string, productId: string, change: number, reason: string): Promise<Product> => {
    // return fetchApi<Product>(`${API_BASE_URL}/providers/${userId}/products/${productId}/stock`, {
    //     method: 'PATCH',
    //     body: JSON.stringify({ change, reason }),
    // });
    console.log(`[UserDataService] Mock: Updating stock for product ${productId} (user ${userId}) by ${change} due to ${reason}`);
    // This would typically fetch the product, update stock, and save. For mock, assume product exists elsewhere.
    // If managing products fully client-side for mock:
    const productsKey = `gotodo_provider_${userId}_products`;
    let products: Product[] = JSON.parse(localStorage.getItem(productsKey) || '[]');
    const productIndex = products.findIndex(p => p.id === productId);
    if (productIndex > -1) {
        products[productIndex].stock = (products[productIndex].stock || 0) + change;
        if (!products[productIndex].stockHistory) products[productIndex].stockHistory = [];
        products[productIndex].stockHistory?.unshift({
            date: new Date().toISOString(),
            change,
            reason,
            newStockLevel: products[productIndex].stock
        });
        localStorage.setItem(productsKey, JSON.stringify(products));
        return products[productIndex];
    }
    throw new Error(`Product ${productId} not found for user ${userId} in mock data.`);
};

// This utility remains client-side as it's for display formatting or initial mock generation.
export const createGeoLocationFromString = (addressString: string): GeoLocation => {
  console.warn(`[userDataService] createGeoLocationFromString is returning mock lat/lng for address: ${addressString}`);
  let hash = 0;
  for (let i = 0; i < addressString.length; i++) {
    const char = addressString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  const baseLat = 37.7749;
  const baseLng = -122.4194;
  const latOffset = (hash % 10000) / 200000;
  const lngOffset = ((hash >> 16) % 10000) / 200000;

  const mockLat = parseFloat((baseLat + latOffset).toFixed(6));
  const mockLng = parseFloat((baseLng + lngOffset).toFixed(6));
  return { lat: mockLat, lng: mockLng, address: addressString };
};