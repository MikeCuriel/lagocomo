import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const auth = request.cookies.get('auth_lagocomo')?.value === 'true'
  if (!auth) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/clientes/:path*',
    '/lotes/:path*',
    '/ventas/:path*',
    // '/pagos/:path*',
    '/catalogo/:path*',
  ],
}