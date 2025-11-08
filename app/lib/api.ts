// API configuration and service functions
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api';

// Types matching your backend models
export type School = {
  id: number;
  name: string;
};

export type User = {
  member: any;
  email: string;
  id: number;
  firstName: string;
  lastName: string;
  age: number;
  username: string;
  password?: string; // Don't return in responses
  role: string; // "ADMIN", "MEMBER", "SCANNER"
  school?: School;
};

export type Admin = User & {
  // Admin-specific properties can go here
};

export type Member = User & {
  memberId: string;
  passport?: Passport;
  qrCodeUrl?: string;
  ecertificateUrl?: string;
};

export type Scanner = User & {
  stamps?: Stamp[];
};

export type Passport = {
  id: number;
  member: Member;
  // Add other passport properties
};

export type Stamp = {
  id: number;
  scanner: Scanner;
  // Add other stamp properties
};

export type LoginRequest = {
  username: string;
  password: string;
};

export type UserRequest = {
  firstName: string;
  lastName: string;
  age: number;
  username: string;
  password: string;
  role: 'ADMIN' | 'MEMBER' | 'SCANNER';
  schoolId?: number;
  memberId?: string; // For Member type users
};

export type UserResponse = {
  id: number;
  firstName: string;
  lastName: string;
  age: number;
  username: string;
  role: string;
  school?: School;
  memberId?: string; // For Member type users
  passport?: Passport;
  qrCodeUrl?: string;
  ecertificateUrl?: string;
};

// API utility functions
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Get auth token from localStorage
  const token = typeof window !== 'undefined' 
    ? localStorage.getItem('icpep-auth-token') 
    : null;
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  console.log(`Making API request to: ${url}`); // Debug log
  
  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    console.error(`API request failed: ${url} - ${response.status} ${response.statusText}`); // Debug log
    throw new Error(`API request failed: ${response.status} ${response.statusText} (URL: ${url})`);
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  
  return {} as T;
}

// User API functions
export const userAPI = {
  // Get all users (for admin)
  getAllUsers: (): Promise<UserResponse[]> =>
    apiRequest<UserResponse[]>('/users'),

  // Get user by ID
  getUserById: (id: number): Promise<UserResponse> =>
    apiRequest<UserResponse>(`/users/${id}`),

  // Create user
  createUser: (userRequest: UserRequest): Promise<UserResponse> =>
    apiRequest<UserResponse>('/users', {
      method: 'POST',
      body: JSON.stringify(userRequest),
    }),

  // Update user
  updateUser: (id: number, userRequest: UserRequest): Promise<UserResponse> =>
    apiRequest<UserResponse>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userRequest),
    }),

  // Delete user
  deleteUser: (id: number): Promise<void> =>
    apiRequest<void>(`/users/${id}`, {
      method: 'DELETE',
    }),

  // Login
  login: (loginRequest: LoginRequest): Promise<UserResponse> =>
    apiRequest<UserResponse>('/users/login', {
      method: 'POST',
      body: JSON.stringify(loginRequest),
    }),

};

// Member API endpoints (you'll need to implement MemberController in your backend)
export const memberAPI = {
  // Get all members
  getAllMembers: (): Promise<Member[]> =>
    apiRequest<Member[]>('/members'),

  // Get member by ID
  getMemberById: (id: number): Promise<Member> =>
    apiRequest<Member>(`/members/${id}`),

  // Get members by chapter
  getMembersByChapter: (chapter: string): Promise<Member[]> =>
    apiRequest<Member[]>(`/members/chapter/${encodeURIComponent(chapter)}`),

  // Create member
  createMember: (member: Omit<Member, 'id' | 'createdAt' | 'updatedAt'>): Promise<Member> =>
    apiRequest<Member>('/members', {
      method: 'POST',
      body: JSON.stringify(member),
    }),

  // Update member
  updateMember: (id: number, member: Partial<Member>): Promise<Member> =>
    apiRequest<Member>(`/members/${id}`, {
      method: 'PUT',
      body: JSON.stringify(member),
    }),

  // Delete member
  deleteMember: (id: number): Promise<void> =>
    apiRequest<void>(`/members/${id}`, {
      method: 'DELETE',
    }),
};



// Auth utilities
export const authAPI = {
  // Store auth token
  setAuthToken: (token: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('icpep-auth-token', token);
    }
  },

  // Get auth token
  getAuthToken: (): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('icpep-auth-token');
    }
    return null;
  },

  // Remove auth token
  removeAuthToken: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('icpep-auth-token');
    }
  },
};
