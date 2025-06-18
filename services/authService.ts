// src/services/authService.ts
import { User, UserRole, NotificationPreferences, Review } from '../types.js'; 

const MOCK_USERS_DB_KEY = 'GOTODO_MOCK_USERS_DB';

const defaultNotificationPreferences: NotificationPreferences = {
  emailForNewBids: true,
  pushForStatusUpdates: true,
  promotionalOffers: false,
  platformAnnouncements: true,
};

const mockReviewsProvider1: Review[] = [
    { reviewerId: 'requester1', reviewerName: 'John D.', rating: 5, text: "Jane was fantastic! Very professional and efficient. Highly recommended for plumbing work.", date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), reviewTitle: "Excellent Plumber!", aspectRatings: { quality: 5, communication: 5, timeliness: 5} },
    { reviewerId: 'user_xyz', reviewerName: 'Alex P.', rating: 4, text: "Good service overall. Arrived a bit late but got the job done well.", date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(), reviewTitle: "Reliable Service", aspectRatings: { quality: 4, communication: 4, timeliness: 3} },
];
const mockReviewsProviderSuspended: Review[] = [
    { reviewerId: 'requester_abc', reviewerName: 'Sam T.', rating: 2, text: "Did not complete the task as agreed and was unresponsive.", date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), reviewTitle: "Problematic Service", aspectRatings: { quality: 1, communication: 1, timeliness: 1} },
];


const loadMockUsers = (): User[] => {
  console.log('[AuthService] Attempting to load mock users...');
  const storedUsers = localStorage.getItem(MOCK_USERS_DB_KEY);
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

  let currentUsers: User[] = [];

  if (storedUsers) {
    console.log('[AuthService] Found users in localStorage:', storedUsers);
    try {
      const parsedUsers = JSON.parse(storedUsers) as User[];
      if (Array.isArray(parsedUsers) && parsedUsers.every(u => u && u.id && u.email && u.role)) {
        currentUsers = parsedUsers.map(u => ({
            ...u, // Spread existing user data first
            phone: u.phone || '',
            notificationPreferences: u.notificationPreferences || { ...defaultNotificationPreferences },
            status: u.status || 'active',
            averageRating: u.averageRating !== undefined ? u.averageRating : 0, 
            // Default provider-specific fields if not present
            skills: u.skills || (u.role === UserRole.PROVIDER ? [] : undefined),
            equipment: u.equipment || (u.role === UserRole.PROVIDER ? [] : undefined),
            detailedReviews: u.detailedReviews || (u.role === UserRole.PROVIDER ? [] : undefined),
            badges: u.badges || (u.role === UserRole.PROVIDER ? [] : undefined),
            verificationLevel: u.verificationLevel || (u.role === UserRole.PROVIDER ? 'basic' : undefined),
            priceRange: u.priceRange || (u.role === UserRole.PROVIDER ? 'medium' : undefined),
            isVerified: u.isVerified !== undefined ? u.isVerified : (u.role === UserRole.PROVIDER ? false : undefined),
            tasksCompletedCount: u.tasksCompletedCount || (u.role === UserRole.PROVIDER ? 0 : undefined),
            memberSinceDate: u.memberSinceDate || (u.role === UserRole.PROVIDER ? new Date().toISOString() : undefined),
            operationalHours: u.operationalHours || (u.role === UserRole.PROVIDER ? "N/A" : undefined),
            bio: u.bio || (u.role === UserRole.PROVIDER ? "N/A" : undefined),
        }));
        console.log('[AuthService] Successfully loaded and parsed users from localStorage:', currentUsers);
      } else {
        console.warn('[AuthService] Invalid or improperly structured user data in localStorage. Defaulting user list.');
        currentUsers = [...defaultUsersList]; 
      }
    } catch (e) {
      console.error('[AuthService] Error parsing mock users from localStorage. Defaulting user list.', e);
      currentUsers = [...defaultUsersList]; 
    }
  } else {
    console.log('[AuthService] No users found in localStorage. Initializing with defaults.');
    currentUsers = [...defaultUsersList];
  }

  // Ensure default users have all new fields from the User type
  currentUsers = currentUsers.map(u => {
    const defaultUser = defaultUsersList.find(du => du.id === u.id);
    return {
      ...defaultUser, // Start with defaults to ensure all fields
      ...u,           // Override with stored/current values
      // Explicitly ensure all provider fields if role is provider
      ...(u.role === UserRole.PROVIDER && {
        skills: u.skills || defaultUser?.skills || [],
        equipment: u.equipment || defaultUser?.equipment || [],
        detailedReviews: u.detailedReviews || defaultUser?.detailedReviews || [],
        badges: u.badges || defaultUser?.badges || [],
        verificationLevel: u.verificationLevel || defaultUser?.verificationLevel || 'basic',
        priceRange: u.priceRange || defaultUser?.priceRange || 'medium',
        isVerified: u.isVerified !== undefined ? u.isVerified : (defaultUser?.isVerified !== undefined ? defaultUser.isVerified : false),
        tasksCompletedCount: u.tasksCompletedCount !== undefined ? u.tasksCompletedCount : (defaultUser?.tasksCompletedCount !== undefined ? defaultUser.tasksCompletedCount : 0),
        memberSinceDate: u.memberSinceDate || defaultUser?.memberSinceDate || new Date().toISOString(),
        operationalHours: u.operationalHours || defaultUser?.operationalHours || "N/A",
        bio: u.bio || defaultUser?.bio || "N/A",
      }),
      averageRating: u.averageRating !== undefined ? u.averageRating : (defaultUser?.averageRating !== undefined ? defaultUser.averageRating : 0),
    };
  });


  if (!currentUsers.some(u => u.email === 'admin@example.com')) {
    console.log('[AuthService] Default admin user not found. Adding.');
    const adminUser = defaultUsersList.find(u => u.email === 'admin@example.com');
    if(adminUser) currentUsers.push(adminUser);
  }
  
  console.log('[AuthService] Final initialized mockUsers list:', currentUsers);
  localStorage.setItem(MOCK_USERS_DB_KEY, JSON.stringify(currentUsers)); 
  return currentUsers;
};

let mockUsers: User[] = loadMockUsers();

const saveMockUsers = () => {
  console.log('[AuthService] Saving mock users to localStorage:', mockUsers);
  localStorage.setItem(MOCK_USERS_DB_KEY, JSON.stringify(mockUsers));
};

export const mockLogin = (email: string, password_DUMMY: string): Promise<User> => {
  console.log(`[AuthService] Attempting login for email: "${email}"`);
  mockUsers = loadMockUsers(); 
  console.log('[AuthService] Current mockUsers list for login check:', mockUsers);
  
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const user = mockUsers.find(u => u.email === email);
      if (user) {
        if (user.status === 'suspended') {
          console.warn(`[AuthService] Login failed: User "${email}" is suspended.`);
          reject(new Error('Your account is suspended. Please contact support.'));
          return;
        }
        console.log('[AuthService] Login successful for user:', user);
        resolve({ 
            ...user, 
            phone: user.phone || '',
            notificationPreferences: user.notificationPreferences || { ...defaultNotificationPreferences },
            status: user.status || 'active',
            averageRating: user.averageRating !== undefined ? user.averageRating : 0,
        });
      } else {
        console.warn('[AuthService] Login failed: No user found with that email.');
        reject(new Error('Invalid credentials'));
      }
    }, 500);
  });
};

export const mockRegister = (name: string, email: string, password_DUMMY: string, role: UserRole): Promise<User> => {
  console.log(`[AuthService] Attempting registration for email: "${email}" with name: "${name}", role: "${role}"`);
  mockUsers = loadMockUsers(); 
  console.log('[AuthService] Current mockUsers list before registration:', mockUsers);

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (mockUsers.some(u => u.email === email)) {
        console.warn(`[AuthService] Registration failed: User with email "${email}" already exists.`);
        reject(new Error('User already exists'));
        return;
      }
      const newUser: User = {
        id: `user-${Date.now()}`,
        name,
        email,
        role,
        faceIdRegistered: false, 
        avatarUrl: `https://picsum.photos/seed/${name.replace(/\s+/g, '')}/100/100`,
        phone: '', 
        notificationPreferences: { ...defaultNotificationPreferences }, 
        registrationDate: new Date().toISOString(),
        status: 'active', 
        averageRating: 0, 
        ...(role === UserRole.PROVIDER && {
            skills: [],
            equipment: [],
            detailedReviews: [],
            badges: [],
            verificationLevel: 'basic',
            priceRange: 'medium',
            availabilitySlots: [],
            blockedTimeSlots: [],
            dailyRoutineRoutes: [],
            hunterModeSettings: { isEnabled: false },
            operationalHours: "Mon-Fri 9am-5pm",
            tasksCompletedCount: 0,
            memberSinceDate: new Date().toISOString(),
            isVerified: false,
            bio: "New provider, ready to offer services!"
        }),
      };
      mockUsers.push(newUser);
      saveMockUsers(); 
      console.log('[AuthService] Registration successful. New user added:', newUser);
      console.log('[AuthService] MockUsers list after registration:', mockUsers);
      resolve(newUser);
    }, 500);
  });
};

export const mockLogout = (): Promise<void> => {
  console.log('[AuthService] User logout');
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, 200);
  });
};

export const mockUpdateUserStatus = (userId: string, newStatus: 'active' | 'suspended' | 'pending_verification'): Promise<User> => {
  console.log(`[AuthService] Attempting to update status for user ID: "${userId}" to "${newStatus}"`);
  mockUsers = loadMockUsers(); 
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const userIndex = mockUsers.findIndex(u => u.id === userId);
      if (userIndex !== -1) {
        mockUsers[userIndex].status = newStatus;
        if (newStatus === 'active' && mockUsers[userIndex].status === 'pending_verification') {
           console.log(`[AuthService] User ${userId} verified and activated.`);
        }
        saveMockUsers();
        console.log('[AuthService] User status updated successfully:', mockUsers[userIndex]);
        resolve(mockUsers[userIndex]);
      } else {
        console.warn('[AuthService] Update status failed: No user found with that ID.');
        reject(new Error('User not found for status update.'));
      }
    }, 300);
  });
};

// Function to add a review to a provider (callable from elsewhere, e.g., when a requester leaves a review)
export const addReviewToProvider = (providerId: string, review: Review): void => {
    mockUsers = loadMockUsers();
    const providerIndex = mockUsers.findIndex(p => p.id === providerId && p.role === UserRole.PROVIDER);
    if (providerIndex !== -1) {
        const provider = mockUsers[providerIndex];
        if (!provider.detailedReviews) {
            provider.detailedReviews = [];
        }
        provider.detailedReviews.push(review);
        // Recalculate average rating
        provider.averageRating = provider.detailedReviews.length > 0 ? provider.detailedReviews.reduce((acc, r) => acc + r.rating, 0) / provider.detailedReviews.length : 0;
        saveMockUsers();
        console.log(`[AuthService] Added review to provider ${providerId}. New avg rating: ${provider.averageRating}`);
    } else {
        console.warn(`[AuthService] Provider ${providerId} not found for adding review.`);
    }
};