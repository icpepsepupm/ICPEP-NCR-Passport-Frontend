// Event data access functions
import { createClient } from './client'

export const eventQueries = {
  // Get all events
  async getAllEvents() {
    const supabase = createClient()
    return supabase
      .from('events')
      .select('*')
      .order('schedule', { ascending: false })
  },

  // Get event by ID
  async getEventById(eventId: number) {
    const supabase = createClient()
    return supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single()
  },

  // Get events by type
  async getEventsByType(eventType: string) {
    const supabase = createClient()
    return supabase
      .from('events')
      .select('*')
      .eq('event_type', eventType)
      .order('schedule', { ascending: false })
  },

  // Get upcoming events
  async getUpcomingEvents(limit = 10) {
    const supabase = createClient()
    return supabase
      .from('events')
      .select('*')
      .gt('schedule', new Date().toISOString())
      .order('schedule', { ascending: true })
      .limit(limit)
  },

  // Get past events
  async getPastEvents(limit = 10) {
    const supabase = createClient()
    return supabase
      .from('events')
      .select('*')
      .lt('schedule', new Date().toISOString())
      .order('schedule', { ascending: false })
      .limit(limit)
  },

  // Get event with attendance stats
  async getEventWithStats(eventId: number) {
    const supabase = createClient()
    return supabase
      .from('event_stats')
      .select('*')
      .eq('id', eventId)
      .single()
  },

  // Get all event stats
  async getAllEventStats() {
    const supabase = createClient()
    return supabase
      .from('event_stats')
      .select('*')
      .order('total_stamps', { ascending: false })
  },

  // Create event (admin only)
  async createEvent(event: {
    name: string
    schedule: string
    venue_name: string
    venue_image?: string
    description?: string
    badge?: string
    event_type: 'GENERAL_ASSEMBLY' | 'COMPETITION' | 'WEBINAR' | 'OTHERS'
  }) {
    const supabase = createClient()
    return supabase
      .from('events')
      .insert([event])
      .select()
      .single()
  },

  // Update event (admin only)
  async updateEvent(eventId: number, updates: Record<string, any>) {
    const supabase = createClient()
    return supabase
      .from('events')
      .update(updates)
      .eq('id', eventId)
      .select()
      .single()
  },

  // Delete event (admin only)
  async deleteEvent(eventId: number) {
    const supabase = createClient()
    return supabase
      .from('events')
      .delete()
      .eq('id', eventId)
  },
}
