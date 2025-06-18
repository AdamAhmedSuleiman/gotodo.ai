// src/services/authService.ts
import { User, UserRole, NotificationPreferences, Review } from '../types.js'; 

const API_BASE_URL = '/api'; // Conceptual API base URL

const defaultNotificationPreferences: NotificationPreferences = {
  emailForNewBids: true,
  pushForStatusUpdates: true,
  promotionalOffers: false,
  platformAnnouncements: true,
};

// Helper for API calls
async function fetchApi<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      // Authorization header would be added here if token management was in place
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


export const login = async (email: string, password_DUMMY: string): Promise<User> => {
  console.log(`[AuthService] Attempting API login for email: "${email}"`);
  try {
    const user = await fetchApi<User>(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email, password: password_DUMMY }), // Send password to backend
    });
     if (user.status === 'suspended') {
        console.warn(`[AuthService] Login failed: User "${email}" is suspended.`);
        throw new Error('Your account is suspended. Please contact support.');
    }
    // Ensure all necessary fields are present, similar to mock data hydration
    return {
        ...user,
        phone: user.phone || '',
        notificationPreferences: user.notificationPreferences || { ...defaultNotificationPreferences },
        status: user.status || 'active',
        averageRating: user.averageRating !== undefined ? user.averageRating : 0,
    };
  } catch (error) {
    console.error('[AuthService] API Login failed:', error);
    throw error;
  }
};

export const register = async (name: string, email: string, password_DUMMY: string, role: UserRole): Promise<User> => {
  console.log(`[AuthService] Attempting API registration for email: "${email}"`);
  try {
    const newUser = await fetchApi<User>(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      body: JSON.stringify({ name, email, password: password_DUMMY, role }),
    });
    // Hydrate with defaults if necessary, similar to mock
    return {
        ...newUser,
        faceIdRegistered: newUser.faceIdRegistered || false,
        avatarUrl: newUser.avatarUrl || `https://picsum.photos/seed/${name.replace(/\s+/g, '')}/100/100`,
        phone: newUser.phone || '',
        notificationPreferences: newUser.notificationPreferences || { ...defaultNotificationPreferences },
        registrationDate: newUser.registrationDate || new Date().toISOString(),
        status: newUser.status || 'active',
        averageRating: newUser.averageRating || 0,
        ...(role === UserRole.PROVIDER && {
            skills: newUser.skills || [],
            equipment: newUser.equipment || [],
            detailedReviews: newUser.detailedReviews || [],
            badges: newUser.badges || [],
            verificationLevel: newUser.verificationLevel || 'basic',
            priceRange: newUser.priceRange || 'medium',
            availabilitySlots: newUser.availabilitySlots || [],
            blockedTimeSlots: newUser.blockedTimeSlots || [],
            dailyRoutineRoutes: newUser.dailyRoutineRoutes || [],
            hunterModeSettings: newUser.hunterModeSettings || { isEnabled: false, maxDistanceKm: 20, preferredServiceTypes: [], minRequestPrice: undefined, minRequesterRating: undefined, keywords: undefined },
            operationalHours: newUser.operationalHours || "Mon-Fri 9am-5pm",
            tasksCompletedCount: newUser.tasksCompletedCount || 0,
            memberSinceDate: newUser.memberSinceDate || new Date().toISOString(),
            isVerified: newUser.isVerified || false,
            bio: newUser.bio || "New provider, ready to offer services!"
        }),
    };
  } catch (error) {
    console.error('[AuthService] API Registration failed:', error);
    throw error;
  }
};

export const logout = async (): Promise<void> => {
  console.log('[AuthService] API User logout');
  try {
    await fetchApi<void>(`${API_BASE_URL}/auth/logout`, { method: 'POST' });
    // Token invalidation would happen on the backend
  } catch (error) {
    console.error('[AuthService] API Logout failed:', error);
    // Even if API logout fails, proceed with client-side cleanup
  }
};

export const updateUserStatus = async (userId: string, newStatus: 'active' | 'suspended' | 'pending_verification'): Promise<User> => {
  console.log(`[AuthService] Attempting API update status for user ID: "${userId}" to "${newStatus}"`);
  try {
    return await fetchApi<User>(`${API_BASE_URL}/admin/users/${userId}/status`, {
      method: 'PATCH', // Or PUT
      body: JSON.stringify({ status: newStatus }),
    });
  } catch (error) {
    console.error('[AuthService] API Update user status failed:', error);
    throw error;
  }
};

// For admin portal to get list of users (conceptual)
export const getAllUsers = async (): Promise<User[]> => {
    console.log('[AuthService] API: Fetching all users for admin.');
    try {
        return await fetchApi<User[]>(`${API_BASE_URL}/admin/users`);
    } catch (error) {
        console.error('[AuthService] API: Failed to fetch all users', error);
        throw error;
    }
};


export const addReviewToProvider = async (providerId: string, review: Review): Promise<User> => {
  console.log(`[AuthService] API: Adding review to provider ${providerId}`);
  try {
    // Assuming the API returns the updated provider profile or a success message
    // For now, let's assume it returns the updated provider User object
    return await fetchApi<User>(`${API_BASE_URL}/providers/${providerId}/reviews`, {
        method: 'POST',
        body: JSON.stringify(review),
    });
  } catch (error) {
    console.error(`[AuthService] API: Failed to add review to provider ${providerId}`, error);
    throw error;
  }
};

export const getInitialMockUsersForSeedingInfo = (): User[] => {
  console.warn("[AuthService] getInitialMockUsersForSeedingInfo is for dev/seeding info only and does not reflect live backend data.");
  const mockReviewsProvider1: Review[] = [
    { reviewerId: 'requester1', reviewerName: 'John D.', rating: 5, text: "Jane was fantastic! Very professional and efficient. Highly recommended for plumbing work.", date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), reviewTitle: "Excellent Plumber!", aspectRatings: { quality: 5, communication: 5, timeliness: 5} },
    { reviewerId: 'user_xyz', reviewerName: 'Alex P.', rating: 4, text: "Good service overall. Arrived a bit late but got the job done well.", date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(), reviewTitle: "Reliable Service", aspectRatings: { quality: 4, communication: 4, timeliness: 3} },
  ];
  const mockReviewsProviderSuspended: Review[] = [
      { reviewerId: 'requester_abc', reviewerName: 'Sam T.', rating: 2, text: "Did not complete the task as agreed and was unresponsive.", date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), reviewTitle: "Problematic Service", aspectRatings: { quality: 1, communication: 1, timeliness: 1} },
  ];
  const defaultUsersList: User[] = [
    { 
      id: 'requester1', 
      email: 'requester@example.com', 
      name: 'John Doe', 
      role: UserRole.REQUESTER, 
      faceIdRegistered: true, 
      avatarUrl: 'https://picsum.photos/seed/requester1/100/100',
      phone: '555-123-4567',
      notificationPreferences: { ...defaultNotificationPreferences, promotionalOffers: true },
      status: 'active',
      averageRating: 4.5, 
    },
    { 
      id: 'provider1', 
      email: 'provider@example.com', 
      name: 'Jane Smith (Plumber & Handyman)', 
      role: UserRole.PROVIDER, 
      faceIdRegistered: true, 
      avatarUrl: 'https://picsum.photos/seed/provider1/100/100',
      phone: '555-987-6543',
      notificationPreferences: { ...defaultNotificationPreferences },
      status: 'active',
      skills: ['Plumbing', 'Fixture Installation', 'Leak Repair', 'Drain Cleaning', 'General Handyman'],
      equipment: ['Basic Tools', 'Pipe Wrench', 'Snake Auger', 'Van'],
      detailedReviews: mockReviewsProvider1,
      averageRating: mockReviewsProvider1.length > 0 ? mockReviewsProvider1.reduce((acc, r) => acc + r.rating, 0) / mockReviewsProvider1.length : 0,
      badges: ['Top Rated', 'Verified Pro', 'Fast Responder'],
      verificationLevel: 'pro',
      priceRange: 'medium',
      isVerified: true,
      tasksCompletedCount: 150,
      memberSinceDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 365).toISOString(), // 1 year ago
      operationalHours: "Mon-Fri 8am-6pm, Sat 10am-2pm",
      bio: "Experienced and reliable plumber and handyman. Quality work guaranteed."
    },
    {
      id: 'admin1',
      email: 'admin@example.com',
      name: 'Admin User',
      role: UserRole.ADMIN,
      faceIdRegistered: false,
      avatarUrl: 'https://picsum.photos/seed/adminuser/100/100',
      phone: '555-000-0000',
      notificationPreferences: { ...defaultNotificationPreferences, emailForNewBids: false },
      registrationDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 100).toISOString(),
      lastLogin: new Date().toISOString(),
      status: 'active',
      averageRating: 0, 
    },
     { id: 'user_pending', email: 'pending@example.com', name: 'Pending User', role: UserRole.REQUESTER, faceIdRegistered: false, status: 'pending_verification', registrationDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), phone: '', notificationPreferences: {...defaultNotificationPreferences}, averageRating: 3.0 },
    { 
      id: 'user_suspended', 
      email: 'suspended@example.com', 
      name: 'Suspended Provider', 
      role: UserRole.PROVIDER, 
      faceIdRegistered: true, 
      status: 'suspended', 
      registrationDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(), 
      lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), 
      phone: '', 
      notificationPreferences: {...defaultNotificationPreferences},
      skills: ['Painting', 'Drywall Repair'],
      equipment: ['Ladders', 'Paint Sprayer'],
      detailedReviews: mockReviewsProviderSuspended,
      averageRating: mockReviewsProviderSuspended.length > 0 ? mockReviewsProviderSuspended.reduce((acc, r) => acc + r.rating, 0) / mockReviewsProviderSuspended.length : 0,
      badges: ['Previously Verified'],
      verificationLevel: 'basic',
      priceRange: 'low',
      isVerified: false,
      tasksCompletedCount: 20,
      memberSinceDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90).toISOString(), // 90 days ago
      operationalHours: "Weekends only",
      bio: "Painter and drywall expert. Currently suspended."
    },
  ];
  return defaultUsersList;
};
