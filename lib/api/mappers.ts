import type { EventType } from '@/lib/types/supabase'

export type ClientUser = {
  id: string
  firstName: string | null
  lastName: string | null
  username: string | null
  email?: string | null
  role: string
  schoolId?: number | null
  memberId?: string | null
  qrCodeUrl?: string | null
  ecertificateUrl?: string | null
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  age?: number | null
}

export type ClientEvent = {
  id: number
  name: string
  date: string
  location: string
  description: string
  attendees: number
  eventType: EventType
  schedule?: string | null
  venueName?: string | null
  badge?: string | null
}

export type ClientStamp = {
  id: number
  stampDate: string
  eventName: string
  eventSchedule: string
  eventVenue: string
  eventType: EventType
}

export function mapDbUser(row: Record<string, unknown>): ClientUser {
  const isActive = row.is_active !== false
  return {
    id: String(row.id),
    firstName: (row.first_name as string) ?? null,
    lastName: (row.last_name as string) ?? null,
    username: (row.username as string) ?? null,
    email: (row.email as string) ?? null,
    role: String(row.role ?? 'MEMBER'),
    schoolId: (row.school_id as number) ?? null,
    memberId: (row.member_id as string) ?? null,
    qrCodeUrl: (row.qr_code_url as string) ?? null,
    ecertificateUrl: (row.ecertificate_url as string) ?? null,
    status: isActive ? 'APPROVED' : 'PENDING',
    age: null,
  }
}

export function mapDbEvent(
  row: Record<string, unknown>,
  attendeeCount = 0
): ClientEvent {
  const schedule = row.schedule as string | null
  return {
    id: Number(row.id),
    name: String(row.name ?? ''),
    date: schedule ? schedule.split('T')[0] : '',
    location: String(row.venue_name ?? ''),
    description: String(row.description ?? ''),
    attendees: attendeeCount,
    eventType: (row.event_type as EventType) ?? 'OTHERS',
    schedule,
    venueName: (row.venue_name as string) ?? null,
    badge: (row.badge as string) ?? null,
  }
}

export function mapClientEventToDb(body: Record<string, unknown>) {
  const date = body.date as string | undefined
  const schedule = date
    ? new Date(date).toISOString()
    : (body.schedule as string | undefined) ?? new Date().toISOString()

  return {
    name: body.name,
    schedule,
    venue_name: body.location ?? body.venue_name ?? '',
    description: body.description ?? '',
    event_type: body.eventType ?? body.event_type ?? 'OTHERS',
    badge: body.badge ?? null,
    venue_image: body.venue_image ?? null,
  }
}

export function mapClientUserToDb(body: Record<string, unknown>) {
  const mapped: Record<string, unknown> = {}
  if (body.firstName !== undefined) mapped.first_name = body.firstName
  if (body.lastName !== undefined) mapped.last_name = body.lastName
  if (body.username !== undefined) mapped.username = body.username
  if (body.email !== undefined) mapped.email = body.email
  if (body.role !== undefined) mapped.role = body.role
  if (body.schoolId !== undefined) mapped.school_id = body.schoolId
  if (body.memberId !== undefined) mapped.member_id = body.memberId
  if (body.ecertificateUrl !== undefined) mapped.ecertificate_url = body.ecertificateUrl
  if (body.status !== undefined) {
    mapped.is_active = body.status === 'APPROVED'
  }
  return mapped
}

export function mapDbStamp(
  stamp: Record<string, unknown>,
  event?: Record<string, unknown> | null
): ClientStamp {
  return {
    id: Number(stamp.id),
    stampDate: String(stamp.stamp_date ?? stamp.created_at ?? ''),
    eventName: String(event?.name ?? 'Unknown Event'),
    eventSchedule: String(event?.schedule ?? ''),
    eventVenue: String(event?.venue_name ?? ''),
    eventType: (event?.event_type as EventType) ?? 'OTHERS',
  }
}
