// Passport and Stamp data access functions
import { createClient } from './client'

export const passportQueries = {
  // Get passport by member ID
  async getPassportByMemberId(memberId: string) {
    const supabase = createClient()
    return supabase
      .from('passports')
      .select('*')
      .eq('member_id', memberId)
      .single()
  },

  // Get passport with full summary (using PL/pgSQL function)
  async getPassportSummary(memberId: string) {
    const supabase = createClient()
    const { data, error } = await supabase.rpc('get_member_passport_summary', {
      p_member_id: memberId,
    })

    return { data, error }
  },

  // Create passport for member
  async createPassport(memberId: string) {
    const supabase = createClient()
    return supabase
      .from('passports')
      .insert([{ member_id: memberId }])
      .select()
      .single()
  },

  // Get all passports (admin only)
  async getAllPassports() {
    const supabase = createClient()
    return supabase
      .from('passports')
      .select('*, users(*)')
      .order('created_at', { ascending: false })
  },
}

export const stampQueries = {
  // Create stamp (scanner + business logic)
  async createStamp(
    passportId: number,
    eventId: number,
    scannerId: string
  ) {
    const supabase = createClient()
    const { data, error } = await supabase.rpc('create_stamp', {
      p_passport_id: passportId,
      p_event_id: eventId,
      p_scanner_id: scannerId,
    })

    return { data, error }
  },

  // Get stamps for passport
  async getPassportStamps(passportId: number) {
    const supabase = createClient()
    return supabase
      .from('stamps')
      .select('*, events(*), users:scanner_id(*)')
      .eq('passport_id', passportId)
      .order('stamp_date', { ascending: false })
  },

  // Get stamps for event (admin + scanner)
  async getEventStamps(eventId: number) {
    const supabase = createClient()
    const { data, error } = await supabase.rpc('get_event_attendance', {
      p_event_id: eventId,
    })

    return { data, error }
  },

  // Get stamp count for passport
  async getPassportStampCount(passportId: number) {
    const supabase = createClient()
    const { count, error } = await supabase
      .from('stamps')
      .select('id', { count: 'exact', head: true })
      .eq('passport_id', passportId)

    return { count, error }
  },

  // Check if stamp exists
  async checkStampExists(passportId: number, eventId: number) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('stamps')
      .select('id')
      .eq('passport_id', passportId)
      .eq('event_id', eventId)
      .single()

    return { exists: !!data, error }
  },

  // Get member attendance history (using view)
  async getMemberAttendance(memberId: string) {
    const supabase = createClient()
    return supabase
      .from('member_attendance')
      .select('*')
      .eq('member_id', memberId)
      .order('stamp_date', { ascending: false })
  },

  // Delete stamp (admin only)
  async deleteStamp(stampId: number) {
    const supabase = createClient()
    return supabase
      .from('stamps')
      .delete()
      .eq('id', stampId)
  },
}
