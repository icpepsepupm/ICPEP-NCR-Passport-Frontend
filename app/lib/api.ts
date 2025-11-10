// -----------------------------
// API configuration
// -----------------------------

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api';
if (!process.env.NEXT_PUBLIC_API_BASE_URL) {
  console.warn('⚠️ NEXT_PUBLIC_API_BASE_URL is not set. Falling back to http://localhost:8080/api');
}

// -----------------------------
// Types
// -----------------------------

export type School = { id: number; name: string };
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
export type Passport = { id: number; member: Member };
export type Stamp = { id: number; timestamp?: string; event?: Event; member?: Member; scanner?: Scanner };
export type Admin = User;
export type Member = User & {
  memberId: string;
  passport?: Passport;
  qrCodeUrl?: string;
  ecertificateUrl?: string;
  status?: MemberStatus;
};
export type Scanner = User & { stamps?: Stamp[] };
export type LoginRequest = { username: string; password: string };
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
export type UserResponse = User & {
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

// -----------------------------
// API Utility (handles JWT automatically)
// -----------------------------

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = typeof window !== 'undefined' ? localStorage.getItem('icpep-auth-token') : null;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  console.log(`🔵 API Request: ${options.method || 'GET'} ${url}`);

  const response = await fetch(url, { ...options, headers, mode: 'cors', credentials: 'include' });
  console.log(`📊 Response status: ${response.status} for ${url}`);

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({ message: response.statusText }));
    if (response.status === 403) console.error('🚫 Access forbidden - check CORS, token, or role');
    throw new Error(errBody.message || `API request failed: ${response.status} ${response.statusText}`);
  }

  const contentType = response.headers.get('content-type');
  if (contentType?.includes('application/json')) return await response.json();
  return {} as T;
}

// -----------------------------
// User API
// -----------------------------

export const userAPI = {
  getAllUsers: (): Promise<UserResponse[]> => apiRequest('/users'),
  getUserById: (id: number): Promise<UserResponse> => apiRequest(`/users/${id}`),
  createUser: (data: UserRequest): Promise<UserResponse> => apiRequest('/users', { method: 'POST', body: JSON.stringify(data) }),
  updateUser: (id: number, data: UserRequest): Promise<UserResponse> => apiRequest(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteUser: (id: number): Promise<void> => apiRequest(`/users/${id}`, { method: 'DELETE' }),
  login: (data: LoginRequest): Promise<UserResponse> => apiRequest('/users/login', { method: 'POST', body: JSON.stringify(data) }),
};

// -----------------------------
// Member API
// -----------------------------
export const memberAPI = {
  getAllMembers: (): Promise<Member[]> => apiRequest('/members'),
  getMemberById: (id: number): Promise<Member> => apiRequest(`/members/${id}`),
  getPendingMembers: async (): Promise<Member[]> => (await userAPI.getAllUsers()).filter(u => u.role === 'MEMBER' && u.status === 'PENDING') as Member[],
  approveMember: (id: number): Promise<UserResponse> => apiRequest(`/users/member/${id}/approve`, { method: 'PUT' }),
  rejectMember: (id: number): Promise<UserResponse> => apiRequest(`/users/member/${id}/reject`, { method: 'PUT' }),
  createMember: (member: Omit<Member, 'id'>): Promise<Member> => apiRequest('/members', { method: 'POST', body: JSON.stringify(member) }),
  updateMember: (id: number, member: Partial<Member>): Promise<Member> => apiRequest(`/members/${id}`, { method: 'PUT', body: JSON.stringify(member) }),
  deleteMember: (id: number): Promise<void> => apiRequest(`/members/${id}`, { method: 'DELETE' }),

  // ✅ Add this method to fetch attendees for a specific event
  getEventAttendees: (eventId: number): Promise<Member[]> =>
    apiRequest(`/events/${eventId}/attendees`),
};

// -----------------------------
// Event API
// -----------------------------

export const eventAPI = {
  getAllEvents: (): Promise<Event[]> => apiRequest('/events'),
  getEventById: (id: number): Promise<Event> => apiRequest(`/events/${id}`),
  createEvent: (data: CreateEventRequest): Promise<Event> => apiRequest('/events', { method: 'POST', body: JSON.stringify(data) }),
  updateEvent: (id: number, data: Partial<CreateEventRequest>): Promise<Event> => apiRequest(`/events/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteEvent: (id: number): Promise<void> => apiRequest(`/events/${id}`, { method: 'DELETE' }),
  verifyEvent: (name: string): Promise<boolean> => apiRequest(`/events/verify?name=${encodeURIComponent(name)}`),
};

// -----------------------------
// Stamp API
// -----------------------------

export const stampAPI = {
  getStampsByUser: (userId: number): Promise<Stamp[]> => apiRequest(`/users/stamp/user/${userId}`),
};

// -----------------------------
// Registration API
// -----------------------------

export const registrationAPI = {
  getPendingRegistrations: async (): Promise<RegistrationResponse[]> =>
    (await userAPI.getAllUsers())
      .filter(u => u.status === 'PENDING')
      .map(u => ({
        id: u.id,
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.username,
        school: u.school,
        status: u.status || 'PENDING',
        submittedAt: undefined,
        memberId: u.memberId,
      })),
  approveRegistration: (id: number): Promise<UserResponse> => memberAPI.approveMember(id),
  rejectRegistration: (id: number): Promise<UserResponse> => memberAPI.rejectMember(id),
};

// -----------------------------
// Auth utilities
// -----------------------------

export const authAPI = {
  setAuthToken: (token: string) => typeof window !== 'undefined' && localStorage.setItem('icpep-auth-token', token),
  getAuthToken: (): string | null => (typeof window !== 'undefined' ? localStorage.getItem('icpep-auth-token') : null),
  removeAuthToken: () => typeof window !== 'undefined' && localStorage.removeItem('icpep-auth-token'),
};
