import type { User } from 'firebase/auth';
import { KEYS, storage } from './storage';

export type AuthProviderName = 'google' | 'kakao';

export type AppAuthSession = {
  userId: string;
  provider: AuthProviderName;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  lastLoginAt: string;
};

const AUTH_SESSION_EVENT = 'sazoo-auth-session-change';

const emitAuthSessionChange = (session: AppAuthSession | null) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new CustomEvent<AppAuthSession | null>(AUTH_SESSION_EVENT, {
    detail: session,
  }));
};

export const getAuthSession = (): AppAuthSession | null => {
  return storage.get(KEYS.AUTH_SESSION, null) as AppAuthSession | null;
};

export const setAuthSession = (session: AppAuthSession) => {
  storage.set(KEYS.AUTH_SESSION, session);
  emitAuthSessionChange(session);
  return session;
};

export const clearAuthSession = () => {
  storage.remove(KEYS.AUTH_SESSION);
  emitAuthSessionChange(null);
};

export const subscribeToAuthSession = (listener: (session: AppAuthSession | null) => void) => {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<AppAuthSession | null>;
    listener(customEvent.detail ?? getAuthSession());
  };

  window.addEventListener(AUTH_SESSION_EVENT, handler as EventListener);
  return () => {
    window.removeEventListener(AUTH_SESSION_EVENT, handler as EventListener);
  };
};

export const buildGoogleAuthSession = (user: User): AppAuthSession => ({
  userId: user.uid,
  provider: 'google',
  displayName: user.displayName || user.email || 'Google User',
  email: user.email || null,
  photoURL: user.photoURL || null,
  lastLoginAt: new Date().toISOString(),
});

export const buildKakaoAuthSession = (profile: {
  id: string | number;
  displayName?: string | null;
  email?: string | null;
  photoURL?: string | null;
}): AppAuthSession => ({
  userId: `kakao:${String(profile.id)}`,
  provider: 'kakao',
  displayName: profile.displayName || 'Kakao User',
  email: profile.email || null,
  photoURL: profile.photoURL || null,
  lastLoginAt: new Date().toISOString(),
});

export const getCurrentAuthUserId = () => getAuthSession()?.userId;
