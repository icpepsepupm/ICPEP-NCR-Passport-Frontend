// API Route: Generate QR code for member
// POST /api/qr/generate
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { qrCodeService } from '@/lib/qr/qr-service'
import { storageService } from '@/lib/storage/storage-service'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    // Verify user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { memberId } = body

    if (!memberId) {
      return NextResponse.json({ error: 'memberId required' }, { status: 400 })
    }

    // Generate QR code text
    const qrText = qrCodeService.formatMemberQRText(memberId)

    // Generate QR code buffer
    const { buffer, error: qrError } = await qrCodeService.generateQRBuffer(qrText)
    if (qrError || !buffer) {
      return NextResponse.json({ error: 'QR generation failed' }, { status: 500 })
    }

    // Upload to storage
    const { url, error: uploadError } = await storageService.uploadQRCode(buffer, memberId)
    if (uploadError || !url) {
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
    }

    // Update user record with QR code URL
    const { error: updateError } = await supabase
      .from('users')
      .update({ qr_code_url: url })
      .eq('id', memberId)

    if (updateError) {
      return NextResponse.json({ error: 'Database update failed' }, { status: 500 })
    }

    return NextResponse.json({ success: true, url })
  } catch (error) {
    console.error('QR generation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
