import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { AuthService, UserDTO } from '@/modules/auth/auth.service';
import { ISession } from '@/modules/auth/session.model';
import { WeddingService, WeddingDTO } from '@/modules/wedding/wedding.service';
import { IWeddingMembership } from '@/modules/wedding/membership.model';
import { UnauthenticatedError, NotFoundError } from '@/shared/errors/app-error';
import { SESSION_COOKIE_NAME, UserRole } from '@/shared/constants';
import { env } from '@/env';

export const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 days

export function setSessionCookie(response: NextResponse, rawToken: string): void {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: rawToken,
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

export interface AuthContext {
  user: UserDTO;
  session: ISession;
  membership: IWeddingMembership | null;
  wedding: WeddingDTO | null;
}

export interface WeddingMemberContext extends AuthContext {
  membership: IWeddingMembership;
  wedding: WeddingDTO;
  weddingId: string;
  role: UserRole;
}

export async function resolveSession(request?: Request): Promise<AuthContext | null> {
  let token: string | undefined;

  if (request) {
    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader
      .split(';')
      .map((c) => c.trim())
      .find((c) => c.startsWith(`${SESSION_COOKIE_NAME}=`));
    if (match) {
      token = match.substring(SESSION_COOKIE_NAME.length + 1);
    }
  }

  // Fallback to Next.js cookies() helper if available
  if (!token) {
    try {
      const cookieStore = cookies();
      token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    } catch {
      // Outside request context (e.g., testing)
    }
  }

  if (!token) {
    return null;
  }

  const sessionResult = await AuthService.validateSession(token);
  if (!sessionResult) {
    return null;
  }

  const membershipResult = await WeddingService.getMembershipForUser(sessionResult.user.id);

  return {
    user: sessionResult.user,
    session: sessionResult.session,
    membership: membershipResult?.membership ?? null,
    wedding: membershipResult?.wedding ?? null,
  };
}

export async function requireAuth(request?: Request): Promise<AuthContext> {
  const context = await resolveSession(request);
  if (!context) {
    throw new UnauthenticatedError('Authentication required');
  }
  return context;
}

export async function requireWeddingMember(request?: Request): Promise<WeddingMemberContext> {
  const context = await requireAuth(request);

  if (!context.membership || !context.wedding) {
    throw new NotFoundError('You do not belong to an active wedding workspace');
  }

  return {
    ...context,
    membership: context.membership,
    wedding: context.wedding,
    weddingId: context.wedding.id,
    role: context.membership.role,
  };
}
