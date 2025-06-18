// src/services/adminService.ts
import { SystemConfiguration } from '../types.js';

const API_BASE_URL = '/api/admin'; // Conceptual API base URL for admin functions
const SYSTEM_CONFIG_STORAGE_KEY = 'gotodo_system_config';

const initialSystemConfig: SystemConfiguration = {
  commissionRatePercent: 1,
  minimumCommissionUSD: 1,
  serviceCategories: ['Plumbing', 'Electrical', 'Cleaning', 'Delivery', 'Tutoring', 'Landscaping', 'Beauty Services', 'Pet Care'],
  notificationTemplates: {
    newBid: { subject: "You've received a new bid!", body: "Hello {userName},\n\nA provider has placed a bid on your request: {requestTitle}.\nBid Amount: ${bidAmount}\nMessage: {bidMessage}\n\nView details: {requestLink}" },
    taskAccepted: { subject: "Your request has been accepted!", body: "Hello {userName},\n\nProvider {providerName} has accepted your request: {requestTitle}.\n\nTrack progress: {requestLink}" },
    paymentProcessed: { subject: "Payment Processed Successfully", body: "Hello {userName},\n\nYour payment of ${amount} for request {requestTitle} has been processed.\n\nThank you!"}
  },
  featureFlags: {
    enableAdvancedAnalytics: true,
    showExperimentalFeatures: false,
    newOnboardingFlow: true,
  }
};

// Helper for API calls (can be shared if moved to a common utils file)
async function fetchAdminApi<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      // Admin-specific authorization header would be added here
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

// --- System Configuration ---
export const getSystemConfiguration = (): SystemConfiguration => {
  // In a real app, this would fetch from `${API_BASE_URL}/configuration`
  // For now, use localStorage with a default.
  const storedConfig = localStorage.getItem(SYSTEM_CONFIG_STORAGE_KEY);
  if (storedConfig) {
    try {
      return JSON.parse(storedConfig) as SystemConfiguration;
    } catch (e) {
      console.error("Error parsing system config from localStorage, returning default.", e);
      return initialSystemConfig;
    }
  }
  return initialSystemConfig;
};

export const saveSystemConfiguration = (config: SystemConfiguration): void => {
  // In a real app, this would PUT to `${API_BASE_URL}/configuration`
  // For now, save to localStorage.
  console.log("[AdminService] Saving system configuration (mock):", config);
  localStorage.setItem(SYSTEM_CONFIG_STORAGE_KEY, JSON.stringify(config));
  // Simulate API call:
  // return fetchAdminApi<SystemConfiguration>(`${API_BASE_URL}/configuration`, {
  //   method: 'PUT',
  //   body: JSON.stringify(config),
  // });
};

// Other admin-specific functions could go here:
// - Fetching platform analytics data
// - Managing users (already in authService, could be moved/proxied here for admin context)
// - Handling flagged content moderation actions
// - Broadcasting messages

// Example: Placeholder for broadcasting
export const broadcastMessageToUsers = async (message: string, targetAudience: string): Promise<void> => {
    console.log(`[AdminService] API: Broadcasting message to ${targetAudience}: "${message}"`);
    // await fetchAdminApi<void>(`${API_BASE_URL}/broadcast`, {
    //     method: 'POST',
    //     body: JSON.stringify({ message, targetAudience }),
    // });
    // Mock success
    return Promise.resolve();
};
