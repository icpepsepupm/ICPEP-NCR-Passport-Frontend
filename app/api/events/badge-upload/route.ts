import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/api/server-auth'
import { storageService } from '@/lib/storage/storage-service'
import { BADGE_UPLOAD_ACCEPT, BADGE_UPLOAD_MAX_BYTES } from '@/lib/badges/utils'

const ALLOWED_TYPES = new Set(BADGE_UPLOAD_ACCEPT.split(',').map((t) => t.trim()))

export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  try {
    const formData = await request.formData()
    const file = formData.get('file')
    const eventId = formData.get('eventId')

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'file is required' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Use PNG, JPEG, WebP, or GIF.' },
        { status: 400 }
      )
    }

    if (file.size > BADGE_UPLOAD_MAX_BYTES) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 2MB.' },
        { status: 400 }
      )
    }

    const extension = file.name.split('.').pop()?.toLowerCase() || 'png'
    const buffer = Buffer.from(await file.arrayBuffer())

    const { url, error } = await storageService.uploadEventBadge(buffer, {
      contentType: file.type,
      extension,
      eventId: eventId != null ? String(eventId) : undefined,
    })

    if (error || !url) {
      return NextResponse.json(
        { error: 'Failed to upload badge image' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data: { url } })
  } catch (error) {
    console.error('Badge upload error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
