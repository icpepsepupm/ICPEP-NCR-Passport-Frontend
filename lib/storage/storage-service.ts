// Storage utility for Supabase Storage (QR codes, certificates, images)
import { createServerSupabaseClient } from '../supabase/server'

export const storageService = {
  // Upload QR code buffer to storage
  async uploadQRCode(
    buffer: Buffer,
    memberId: string
  ): Promise<{ url: string | null; error: any }> {
    try {
      const supabase = await createServerSupabaseClient()
      const fileName = `qr/${memberId}-${Date.now()}.png`

      const { data, error } = await supabase.storage
        .from(process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || 'passport-assets')
        .upload(fileName, buffer, {
          contentType: 'image/png',
          upsert: false,
        })

      if (error) return { url: null, error }

      const { data: publicData } = supabase.storage
        .from(process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || 'passport-assets')
        .getPublicUrl(fileName)

      return { url: publicData.publicUrl, error: null }
    } catch (error) {
      console.error('QR upload failed:', error)
      return { url: null, error }
    }
  },

  // Upload event image
  async uploadEventImage(
    file: File,
    eventId: number
  ): Promise<{ url: string | null; error: any }> {
    try {
      const supabase = await createServerSupabaseClient()
      const fileName = `events/${eventId}-${Date.now()}-${file.name}`

      const { data, error } = await supabase.storage
        .from(process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || 'passport-assets')
        .upload(fileName, file, {
          contentType: file.type,
          upsert: false,
        })

      if (error) return { url: null, error }

      const { data: publicData } = supabase.storage
        .from(process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || 'passport-assets')
        .getPublicUrl(fileName)

      return { url: publicData.publicUrl, error: null }
    } catch (error) {
      console.error('Event image upload failed:', error)
      return { url: null, error }
    }
  },

  // Upload certificate
  async uploadCertificate(
    buffer: Buffer,
    memberId: string
  ): Promise<{ url: string | null; error: any }> {
    try {
      const supabase = await createServerSupabaseClient()
      const fileName = `certificates/${memberId}-${Date.now()}.pdf`

      const { data, error } = await supabase.storage
        .from(process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || 'passport-assets')
        .upload(fileName, buffer, {
          contentType: 'application/pdf',
          upsert: false,
        })

      if (error) return { url: null, error }

      const { data: publicData } = supabase.storage
        .from(process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || 'passport-assets')
        .getPublicUrl(fileName)

      return { url: publicData.publicUrl, error: null }
    } catch (error) {
      console.error('Certificate upload failed:', error)
      return { url: null, error }
    }
  },

  // Get public URL for file
  async getPublicUrl(fileName: string) {
    const supabase = await createServerSupabaseClient()
    return supabase.storage
      .from(process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || 'passport-assets')
      .getPublicUrl(fileName)
  },

  // Delete file from storage
  async deleteFile(fileName: string): Promise<{ error: any }> {
    try {
      const supabase = await createServerSupabaseClient()
      const { error } = await supabase.storage
        .from(process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || 'passport-assets')
        .remove([fileName])

      return { error }
    } catch (error) {
      console.error('File deletion failed:', error)
      return { error }
    }
  },
}
