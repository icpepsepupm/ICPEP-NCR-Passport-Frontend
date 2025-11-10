// -----------------------------
// API configuration
// -----------------------------

// Use environment variable for API base URL; fallback to localhost for dev only
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api';
if (!API_BASE_URL) {
  console.warn('⚠️ NEXT_PUBLIC_API_BASE_URL is not set. Falling back to http://localhost:8080/api');
}

// -----------------------------
// Types (keep as-is)
// -----------------------------

export type School = { id: number; name: string; };
export type User = {
  id: number;
  firstName: string;
  lastName: string;
  age: number;
  username: string;
  password?: string;
  role: 'ADMIN' | 'MEMBER' | 'SCANNER';
  email?: string;
  school?: School;
  member?: any;
};
export type MemberStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type Passport = { id: number; member: Member; };
export type Stamp = { id: number; timestamp?: string; event?: Event; member?: Member; scanner?: Scanner; };
export type Admin = User;
export type Member = User & {
  memberId: string;
  passport?: Passport;
  qrCodeUrl?: string;
  ecertificateUrl?: string;
  status?: MemberStatus;
};
export type Scanner = User & { stamps?: Stamp[]; };
export type LoginRequest = { username: string; password: string; };
export type UserRequest = {
  firstName: string;
  lastName: string;
  age: number;
  username: string;
  password: string;
  role: 'ADMIN' | 'MEMBER' | 'SCANNER';
  schoolId?: number;
  memberId?: string;
};
export type UserResponse = {
  id: number;
  firstName: string;
  lastName: string;
  age: number;
  username: string;
  role: string;
  school?: School;
  memberId?: string;
  passport?: Passport;
  qrCodeUrl?: string;
  ecertificateUrl?: string;
  status?: MemberStatus;
};
export type Event = {
  id: number;
  name: string;
  schedule: string;
  venueName: string;
  venueImage: string;
  description: string;
  badge: string;
};
export type CreateEventRequest = Omit<Event, 'id'>;

export type RegistrationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type RegistrationResponse = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  school?: School;
  status: RegistrationStatus;
  submittedAt?: string;
  memberId?: string;
};

// Add Registration API endpoints
export const registrationAPI = {
  getPendingRegistrations: async (): Promise<RegistrationResponse[]> => {
    // Get all users with PENDING status
    const allUsers = await userAPI.getAllUsers();
    return allUsers
      .filter(user => user.status === 'PENDING')
      .map(user => ({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.username, // Assuming username is email
        school: user.school,
        status: user.status || 'PENDING',
        submittedAt: undefined, // You can add this field to your backend
        memberId: user.memberId,
      }));
  },

  approveRegistration: async (id: number): Promise<UserResponse> => {
    return memberAPI.approveMember(id);
  },

  rejectRegistration: async (id: number): Promise<UserResponse> => {
    return memberAPI.rejectMember(id);
  },
};
// -----------------------------
// API Utility (fix credentials handling)
// -----------------------------

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  // Only include Authorization header if token exists
  const token = typeof window !== 'undefined'
    ? localStorage.getItem('icpep-auth-token')
    : null;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  console.log(`🔵 API Request: ${options.method || 'GET'} ${url}`);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      mode: 'cors',
      credentials: 'include',
    });

    console.log(`📊 Response status: ${response.status} for ${url}`);

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({ message: response.statusText }));
      if (response.status === 403) {
        console.error('🚫 Access forbidden - check CORS, token, or user role');
      }
      throw new Error(errorBody.message || `API request failed: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      console.log(`✅ Response data:`, data);
      return data;
    }

    return {} as T;
  } catch (error) {
    console.error('❌ API request error:', error);
    throw error;
  }
}

// -----------------------------
// User API
// -----------------------------

export const userAPI = {
  getAllUsers: (): Promise<UserResponse[]> => apiRequest<UserResponse[]>('/users'),
  getUserById: (id: number): Promise<UserResponse> => apiRequest<UserResponse>(`/users/${id}`),
  createUser: (userRequest: UserRequest): Promise<UserResponse> =>
    apiRequest<UserResponse>('/users', { method: 'POST', body: JSON.stringify(userRequest) }),
  updateUser: (id: number, userRequest: UserRequest): Promise<UserResponse> =>
    apiRequest<UserResponse>(`/users/${id}`, { method: 'PUT', body: JSON.stringify(userRequest) }),
  deleteUser: (id: number): Promise<void> =>
    apiRequest<void>(`/users/${id}`, { method: 'DELETE' }),
  login: (loginRequest: LoginRequest): Promise<UserResponse> =>
    apiRequest<UserResponse>('/users/login', { method: 'POST', body: JSON.stringify(loginRequest) }),
};

// -----------------------------
// Member API
// -----------------------------

export const memberAPI = {
  getAllMembers: (): Promise<Member[]> => apiRequest<Member[]>('/members'),
  getMemberById: (id: number): Promise<Member> => apiRequest<Member>(`/members/${id}`),
  getPendingMembers: async (): Promise<Member[]> => {
    const allUsers = await userAPI.getAllUsers();
    return allUsers.filter(user => user.role === 'MEMBER' && user.status === 'PENDING') as Member[];
  },
  approveMember: (id: number): Promise<UserResponse> =>
    apiRequest<UserResponse>(`/users/member/${id}/approve`, { method: 'PUT' }),
  rejectMember: (id: number): Promise<UserResponse> =>
    apiRequest<UserResponse>(`/users/member/${id}/reject`, { method: 'PUT' }),
  getMembersByChapter: (chapter: string): Promise<Member[]> =>
    apiRequest<Member[]>(`/members/chapter/${encodeURIComponent(chapter)}`),
  createMember: (member: Omit<Member, 'id'>): Promise<Member> =>
    apiRequest<Member>('/members', { method: 'POST', body: JSON.stringify(member) }),
  updateMember: (id: number, member: Partial<Member>): Promise<Member> =>
    apiRequest<Member>(`/members/${id}`, { method: 'PUT', body: JSON.stringify(member) }),
  deleteMember: (id: number): Promise<void> =>
    apiRequest<void>(`/members/${id}`, { method: 'DELETE' }),
};

// -----------------------------
// Event API
// -----------------------------

export const eventAPI = {
  getAllEvents: (): Promise<Event[]> => apiRequest<Event[]>('/events'),
  getEventById: (id: number): Promise<Event> => apiRequest<Event>(`/events/${id}`),
  createEvent: (event: CreateEventRequest): Promise<Event> =>
    apiRequest<Event>('/events', { method: 'POST', body: JSON.stringify(event) }),
  updateEvent: (id: number, event: Partial<CreateEventRequest>): Promise<Event> =>
    apiRequest<Event>(`/events/${id}`, { method: 'PUT', body: JSON.stringify(event) }),
  deleteEvent: (id: number): Promise<void> =>
    apiRequest<void>(`/events/${id}`, { method: 'DELETE' }),
  verifyEvent: (name: string): Promise<boolean> =>
    apiRequest<boolean>(`/events/verify?name=${encodeURIComponent(name)}`),
};

// -----------------------------
// Stamp API
// -----------------------------

export const stampAPI = {
  getStampsByUser: (userId: number): Promise<Stamp[]> =>
    apiRequest<Stamp[]>(`/users/stamp/user/${userId}`),
};

// -----------------------------
// Auth utilities
// -----------------------------

export const authAPI = {
  setAuthToken: (token: string) => {
    if (typeof window !== 'undefined') localStorage.setItem('icpep-auth-token', token);
  },
  getAuthToken: (): string | null => (typeof window !== 'undefined' ? localStorage.getItem('icpep-auth-token') : null),
  removeAuthToken: () => {
    if (typeof window !== 'undefined') localStorage.removeItem('icpep-auth-token');
  },
};
