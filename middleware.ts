import { type NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

async function getUserRole(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  userId: string
) {
  const { data } = await supabase.from('users').select('role').eq('id', userId).single()
  return data?.role as string | undefined
}

export async function middleware(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const isAuthPage = pathname.startsWith('/auth') || pathname === '/login'

  if (!user && !isAuthPage && (pathname.startsWith('/admin') || pathname.startsWith('/scanner') || pathname.startsWith('/dashboard'))) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  if (user && isAuthPage && pathname !== '/auth/pending') {
    const role = await getUserRole(supabase, user.id)
    if (role === 'ADMIN') return NextResponse.redirect(new URL('/admin', request.url))
    if (role === 'SCANNER') return NextResponse.redirect(new URL('/scanner', request.url))
    if (role === 'MEMBER') return NextResponse.redirect(new URL(`/dashboard/passport/${user.id}`, request.url))
  }

  if (pathname.startsWith('/admin')) {
    if (!user) return NextResponse.redirect(new URL('/auth/login', request.url))
    const role = await getUserRole(supabase, user.id)
    if (role !== 'ADMIN') return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  if (pathname.startsWith('/scanner')) {
    if (!user) return NextResponse.redirect(new URL('/auth/login', request.url))
    const role = await getUserRole(supabase, user.id)
    if (role !== 'SCANNER' && role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
  }

  if (pathname.startsWith('/dashboard')) {
    if (!user) return NextResponse.redirect(new URL('/auth/login', request.url))
    const role = await getUserRole(supabase, user.id)
    if (role !== 'MEMBER' && role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/scanner/:path*', '/dashboard/:path*', '/auth/:path*', '/login'],
}
