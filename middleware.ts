import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const PUBLIC_PATHS   = ['/forgot-password', '/api/auth/login'];
const AUTH_ONLY_PATH = '/login';

async function verifyToken(token: string, secret: Uint8Array): Promise<boolean> {
    try {
        await jwtVerify(token, secret);
        return true;
    } catch {
        return false;
    }
}

export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const token  = req.cookies.get('token')?.value;

    // Always allow public API routes and static paths
    if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
        return NextResponse.next();
    }

    // If visiting /login while already authenticated → send to dashboard
    if (pathname.startsWith(AUTH_ONLY_PATH)) {
        if (token && await verifyToken(token, secret)) {
            return NextResponse.redirect(new URL('/dashboard', req.url));
        }
        // Not authenticated — allow through to login page, add no-cache
        const res = NextResponse.next();
        res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
        res.headers.set('Pragma', 'no-cache');
        return res;
    }

    // Protected routes — require valid token
    if (!token || !(await verifyToken(token, secret))) {
        const res = NextResponse.redirect(new URL('/login', req.url));
        res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
        return res;
    }

    // Authenticated — add no-cache so back button re-validates
    const res = NextResponse.next();
    res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.headers.set('Pragma', 'no-cache');
    return res;
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|gatronova-logo.png).*)'],
};
