import { NextResponse } from 'next/server';

const AUTH_BYPASS_FLAG = String(process.env.NEXT_PUBLIC_AUTH_BYPASS || '').trim().toLowerCase();
const AUTH_BYPASS_REQUESTED = AUTH_BYPASS_FLAG === '1' || AUTH_BYPASS_FLAG === 'true' || AUTH_BYPASS_FLAG === 'yes' || AUTH_BYPASS_FLAG === 'on';
const AUTH_BYPASS_ENABLED = process.env.NODE_ENV !== 'production' && AUTH_BYPASS_REQUESTED;

export function middleware(request) {
  if (AUTH_BYPASS_ENABLED) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/lesson-activities/:path*', '/dashboard/:path*'],
};
