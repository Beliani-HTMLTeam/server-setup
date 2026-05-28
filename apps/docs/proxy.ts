import { NextRequest, NextResponse } from 'next/server'
import { getSessionCookie } from 'better-auth/cookies'

async function isAuthorized(request: NextRequest): Promise<boolean> {
  const sessionCookie = getSessionCookie(request)
  if (!sessionCookie) return false

  const sessionRes = await fetch(
    `${process.env.BETTER_AUTH_URL}/api/auth/get-session`,
    {
      headers: { cookie: request.headers.get('cookie') || '' },
    }
  )
  const session = sessionRes.ok ? await sessionRes.json() : null

  const allowedEmails = (() => {
    const raw = process.env.ALLOWED_EMAILS

    if (!raw) return []

    try {
      return JSON.parse(raw)
    } catch {
      return raw.split(',').map((e) => e.trim())
    }
  })()

  return !!(session && allowedEmails.includes(session.user?.email ?? ''))
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  let protectedPaths = ['/docs', '/_pagefind']

  if (protectedPaths.some((path) => pathname.startsWith(path))) {
    const authorized = await isAuthorized(request)

    if (!authorized) return redirectToLogin(request)
  }

  return NextResponse.next()
}

function redirectToLogin(request: NextRequest) {
  const url = request.nextUrl.clone()
  url.pathname = '/'
  url.searchParams.set('redirect', request.nextUrl.pathname)
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ['/docs/:path*', '/_pagefind/:path*'],
}
