// src/services/taskService.ts
import { GeoLocation, ChatMessage, RequestData, RequesterRating, TaskProject, RequestStatus, TaskComment } from '../types.js';

const API_BASE_URL = '/api'; // Conceptual API base URL
let publicRequestPool: RequestData[] = []; // In-memory mock for public pool

// Helper for API calls
async function fetchApi<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      // Authorization header would be added here
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

// Mock Provider Location (as part of task updates)
export const saveMockProviderLocation = async (requestId: string, location: GeoLocation): Promise<void> => {
  console.log(`[TaskService] API: Simulating updateTaskLocation for ${requestId}`, location);
  localStorage.setItem(`gotodo_mock_provider_loc_${requestId}`, JSON.stringify(location));
};

export const getMockProviderLocation = (requestId: string): GeoLocation | null => {
  const stored = localStorage.getItem(`gotodo_mock_provider_loc_${requestId}`);
  return stored ? JSON.parse(stored) : null;
};

export const clearMockProviderLocation = (requestId: string): void => {
  localStorage.removeItem(`gotodo_mock_provider_loc_${requestId}`);
};

// Chat Messages
export const getChatMessages = (requestId: string): ChatMessage[] => {
  console.log(`[TaskService] Mock: Fetching chat messages for request ${requestId}`);
  const storedMessages = localStorage.getItem(`chatMessages_${requestId}`);
  return storedMessages ? JSON.parse(storedMessages) : [];
};

export const addChatMessage = async (requestId: string, message: ChatMessage): Promise<ChatMessage> => {
  console.log(`[TaskService] Mock: Adding chat message to request ${requestId}`);
  const currentMessages = getChatMessages(requestId);
  const newMessages = [...currentMessages, message];
  localStorage.setItem(`chatMessages_${requestId}`, JSON.stringify(newMessages));
  return message; // Simulate API returning the saved message
};


// Requester Ratings (by Provider)
export const saveRequesterRating = async (requesterId: string, rating: Omit<RequesterRating, 'providerName'>): Promise<RequesterRating> => {
  console.log(`[TaskService] API: Saving rating for requester ${requesterId}`);
  // Simulate API call
  const ratedRequesterRating = { ...rating, providerName: "Provider Name from Auth" }; // Mock provider name
  // In a real app, you'd save this to a backend. For mock, we can log or store locally if needed for other parts of mock.
  console.log("Mock saved requester rating:", ratedRequesterRating);
  return ratedRequesterRating;
};

export const getRequesterRatings = async (requesterId: string): Promise<RequesterRating[]> => {
  console.log(`[TaskService] API: Fetching ratings for requester ${requesterId}`);
  // Simulate API call
  return []; // Return empty array for mock
};

// Task Earned Amount
export const recordEarnedAmount = (task: RequestData): number => {
  const suggested = task.suggestedPrice || 0;
  let earned = suggested * 0.80; 
  if (earned < 5 && suggested > 0) earned = 5;
  else if (suggested === 0 && task.type === "ride_delivery") earned = 10;
  else if (suggested === 0 && task.type === "professional_service") earned = 20;
  else if (suggested === 0) earned = 5;
  const finalEarned = parseFloat(earned.toFixed(2));
  console.log(`[TaskService] Mock calculation for earned amount for task ${task.id}: $${finalEarned}`);
  return finalEarned;
};


// --- Task Projects ---
export const getTaskProjects = async (userId: string): Promise<TaskProject[]> => {
  console.log(`[TaskService] Mock: Fetching task projects for user ${userId}`);
  const stored = localStorage.getItem(`taskProjects_${userId}`);
  return stored ? JSON.parse(stored) : [];
};

export const saveTaskProject = async (userId: string, project: TaskProject): Promise<TaskProject> => {
  console.log(`[TaskService] Mock: Saving task project "${project.title}" for user ${userId}`);
  const projects = await getTaskProjects(userId);
  const existingIndex = projects.findIndex(p => p.id === project.id);
  if (existingIndex > -1) {
    projects[existingIndex] = project;
  } else {
    projects.push(project);
  }
  localStorage.setItem(`taskProjects_${userId}`, JSON.stringify(projects));
  return project;
};

export const deleteTaskProject = async (userId: string, projectId: string): Promise<void> => {
  console.log(`[TaskService] Mock: Deleting task project ${projectId} for user ${userId}`);
  let projects = await getTaskProjects(userId);
  projects = projects.filter(p => p.id !== projectId);
  localStorage.setItem(`taskProjects_${userId}`, JSON.stringify(projects));
  localStorage.removeItem(`taskComments_${projectId}`); // Also delete associated comments
};

// --- All Public Requests Pool ---
export const getAllPublicRequests = async (): Promise<RequestData[]> => {
  console.log('[TaskService] Mock: Fetching all public (pending) requests');
  return publicRequestPool.filter(req => req.status === RequestStatus.PENDING);
};

export const getRequestFromPublicPool = async (requestId: string): Promise<RequestData | undefined> => {
  console.log(`[TaskService] Mock: Fetching request ${requestId} from public pool`);
  // In a real app, this would be an API call: return fetchApi<RequestData | undefined>(`${API_BASE_URL}/tasks/${requestId}`);
  // For mock, find in the in-memory pool
  return publicRequestPool.find(req => req.id === requestId);
};


export const addRequestToPublicPool = async (request: RequestData): Promise<RequestData> => {
  console.log('[TaskService] Mock: Adding new request to public pool');
  publicRequestPool.push(request);
  // No real API call for mock, just update in-memory array
  return request;
};

export const updateRequestInPublicPool = async (request: RequestData): Promise<RequestData> => {
  console.log(`[TaskService] Mock: Updating request ${request.id} in public pool`);
  const index = publicRequestPool.findIndex(r => r.id === request.id);
  if (index !== -1) {
    publicRequestPool[index] = request;
  } else {
    // If not found, it might be a new request assigned to provider (e.g. direct invite)
    // or a hunted request being accepted. Add it if it wasn't there.
    publicRequestPool.push(request); 
  }
  return request;
};

// Task Project Comments
export const getTaskProjectComments = (projectId: string): TaskComment[] => { // Made synchronous for mock
    console.log(`[TaskService] Mock: Fetching comments for project ${projectId}`);
    const storedComments = localStorage.getItem(`taskComments_${projectId}`);
    return storedComments ? JSON.parse(storedComments) : [];
};

export const addTaskProjectComment = (
  projectId: string,
  commentData: Omit<TaskComment, 'id' | 'timestamp' | 'authorAvatarUrl' | 'projectId'>
): TaskComment => { // Made synchronous for mock
    console.log(`[TaskService] Mock: Adding comment to project ${projectId}`);
    const comments = getTaskProjectComments(projectId);
    const newComment: TaskComment = {
        ...commentData,
        id: `comment-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        timestamp: new Date().toISOString(),
        authorAvatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(commentData.authorName)}&background=random&color=fff&size=32`,
        projectId, // Ensure projectId is added here
    };
    comments.push(newComment);
    localStorage.setItem(`taskComments_${projectId}`, JSON.stringify(comments));
    return newComment;
};

export const deleteTaskProjectComment = (projectId: string, commentId: string): void => { // Made synchronous
    console.log(`[TaskService] Mock: Deleting comment ${commentId} from project ${projectId}`);
    let comments = getTaskProjectComments(projectId);
    comments = comments.filter(c => c.id !== commentId);
    localStorage.setItem(`taskComments_${projectId}`, JSON.stringify(comments));
};

export const editTaskProjectComment = (
  projectId: string,
  commentId: string,
  updatedText: string
): TaskComment | undefined => { // Made synchronous
    console.log(`[TaskService] Mock: Editing comment ${commentId} in project ${projectId}`);
    let comments = getTaskProjectComments(projectId);
    const commentIndex = comments.findIndex(c => c.id === commentId);
    if (commentIndex > -1) {
        comments[commentIndex].text = updatedText;
        comments[commentIndex].timestamp = new Date().toISOString(); // Update timestamp
        localStorage.setItem(`taskComments_${projectId}`, JSON.stringify(comments));
        return comments[commentIndex];
    }
    return undefined;
};
