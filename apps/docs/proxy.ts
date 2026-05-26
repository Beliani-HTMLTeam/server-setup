import { NextRequest, NextResponse } from 'next/server'
import { getSessionCookie } from 'better-auth/cookies'

export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/docs')) {
    const sessionCookie = getSessionCookie(request)

    if (!sessionCookie) {
      return redirectToLogin(request)
    }

    const sessionRes = await fetch(
      `${process.env.BETTER_AUTH_URL}/api/auth/get-session`,
      {
        headers: {
          cookie: request.headers.get('cookie') || '',
        },
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

    if (!session || !allowedEmails.includes(session.user?.email ?? '')) {
      return redirectToLogin(request)
    }
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
  matcher: ['/docs/:path*', '/_pagefind/:path*', '/screenshots/:path*'],
}
