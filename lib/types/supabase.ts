// Supabase database types (auto-generated-like interface)

export type UserRole = 'ADMIN' | 'SCANNER' | 'MEMBER'
export type EventType = 'GENERAL_ASSEMBLY' | 'COMPETITION' | 'WEBINAR' | 'OTHERS'

export interface School {
  id: number
  name: string
  code: string
  created_at: string
}

export interface User {
  id: string // UUID
  first_name: string | null
  last_name: string | null
  username: string | null
  email: string | null
  role: UserRole
  school_id: number | null
  member_id: string | null
  qr_code_url: string | null
  ecertificate_url: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Event {
  id: number
  name: string
  schedule: string | null
  venue_name: string | null
  venue_image: string | null
  description: string | null
  badge: string | null
  event_type: EventType
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface Passport {
  id: number
  member_id: string // UUID, unique
  created_at: string
  updated_at: string
}

export interface Stamp {
  id: number
  passport_id: number
  event_id: number
  scanner_id: string // UUID
  stamp_date: string
  created_at: string
}

export interface EventStats {
  id: number
  name: string
  event_type: EventType
  schedule: string | null
  total_stamps: number
  unique_attendees: number
}

export interface MemberAttendance {
  member_id: string
  username: string | null
  first_name: string | null
  last_name: string | null
  event_id: number | null
  event_name: string | null
  stamp_date: string | null
  scanner_id: string | null
}

export interface AuditLog {
  id: number
  table_name: string
  record_id: string
  action: 'INSERT' | 'UPDATE' | 'DELETE'
  user_id: string | null
  old_data: Record<string, any> | null
  new_data: Record<string, any> | null
  created_at: string
}

// API Response Types

export interface CreateStampResponse {
  success: boolean
  message?: string
  error?: string
  stamp_id?: number
}

export interface PassportSummaryResponse {
  passport_id: number
  member_id: string
  total_events_attended: number
  created_at: string
  error?: string
}

export interface EventAttendanceRecord {
  member_id: string
  username: string | null
  first_name: string | null
  last_name: string | null
  stamp_date: string
  scanner_name: string | null
}

// Request/Payload Types

export interface CreateStampRequest {
  passportId: number
  eventId: number
}

export interface GenerateQRRequest {
  memberId: string
}

export interface BulkImportUsersRequest {
  users: {
    firstName: string
    lastName: string
    username: string
    email: string
    role?: UserRole
    memberId?: string
    schoolId?: number
  }[]
}

export interface CreateEventRequest {
  name: string
  schedule: string
  venue_name: string
  venue_image?: string
  description?: string
  badge?: string
  event_type: EventType
}

export interface UpdateUserRequest {
  first_name?: string
  last_name?: string
  qr_code_url?: string
  ecertificate_url?: string
  school_id?: number
  is_active?: boolean
}
