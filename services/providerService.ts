// src/services/providerService.ts
import { MockProviderProfile, GeoLocation, ServiceType, TransportationMode, Product, ProfessionalService, HunterModeSettings, RequestData } from '../types.js';

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

export const getProviders = async (
  serviceType?: ServiceType,
  location?: GeoLocation,
  radiusKm: number = 20,
  transportationMode?: TransportationMode, // Added for filtering
  textQuery?: string // For keyword/entity search
): Promise<MockProviderProfile[]> => {
  console.log('[ProviderService] API: Fetching providers with criteria:', { serviceType, location, radiusKm, transportationMode, textQuery });
  
  const queryParams = new URLSearchParams();
  if (serviceType && serviceType !== ServiceType.UNKNOWN) queryParams.append('serviceType', serviceType);
  if (location) {
    queryParams.append('lat', location.lat.toString());
    queryParams.append('lng', location.lng.toString());
    queryParams.append('radiusKm', radiusKm.toString());
  }
  if (transportationMode) queryParams.append('transportationMode', transportationMode);
  if (textQuery) queryParams.append('q', textQuery);

  try {
    return await fetchApi<MockProviderProfile[]>(`${API_BASE_URL}/providers?${queryParams.toString()}`);
  } catch (error) {
    console.error('[ProviderService] API: Failed to fetch providers', error);
    throw error;
  }
};

export const getProductDetails = async (productId: string): Promise<Product | undefined> => {
  console.log(`[ProviderService] API: Getting product details for productId: ${productId}`);
  try {
    // Assuming a general product endpoint, or it could be nested under provider
    return await fetchApi<Product>(`${API_BASE_URL}/products/${productId}`);
  } catch (error) {
    console.error(`[ProviderService] API: Failed to fetch product ${productId}`, error);
    // Return undefined or throw, depending on desired error handling
    return undefined; 
  }
};

export const getProviderProfileById = async (providerId: string): Promise<MockProviderProfile | null> => {
  console.log(`[ProviderService] API: Getting profile for providerId: ${providerId}`);
  try {
    return await fetchApi<MockProviderProfile>(`${API_BASE_URL}/providers/${providerId}`);
  } catch (error) {
    console.error(`[ProviderService] API: Failed to fetch profile for provider ${providerId}`, error);
    if ((error as Error).message.includes("404")) return null; // Handle not found gracefully
    throw error;
  }
};

export const findNearbyRequests = async (
  providerLocation: GeoLocation,
  settings: HunterModeSettings,
  // allAvailableRequests is removed, as this logic should be backend-driven
): Promise<RequestData[]> => {
  console.log('[ProviderService] API: Hunter Mode - Finding nearby requests for provider.');
  
  const payload = {
    providerLocation,
    settings
  };

  try {
    return await fetchApi<RequestData[]>(`${API_BASE_URL}/providers/nearby-requests`, {
        method: 'POST', // Or GET with query params if preferred for such search
        body: JSON.stringify(payload)
    });
  } catch (error) {
    console.error('[ProviderService] API: Hunter Mode - Failed to find nearby requests', error);
    throw error;
  }
};
