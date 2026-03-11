import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  browserLocalPersistence,
  getRedirectResult,
  onAuthStateChanged,
  setPersistence,
  signInWithPopup,
  signInWithRedirect,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { auth, googleProvider, isFirebaseReady } from '../config/firebase';
import { api } from '../services/api';
import {
  completeKakaoSignInFromRedirect,
  hasPendingKakaoCallback,
  kakaoEnv,
  signInWithKakaoSdk,
  signOutKakaoSdk,
} from '../config/kakao';
import {
  buildGoogleAuthSession,
  clearAuthSession,
  getAuthSession,
  setAuthSession,
  subscribeToAuthSession,
  type AppAuthSession,
} from '../services/authSession';

type AuthStatus = 'loading' | 'guest' | 'authenticated';
type AuthProviderName = 'google' | 'kakao';

type AuthActionResult = {
  ok: boolean;
  redirected?: boolean;
  error?: string;
};

type AuthContextValue = {
  status: AuthStatus;
  session: AppAuthSession | null;
  error: string | null;
  pendingProvider: AuthProviderName | null;
  isGoogleReady: boolean;
  isKakaoReady: boolean;
  signInWithGoogle: () => Promise<AuthActionResult>;
  signInWithKakao: () => Promise<AuthActionResult>;
  signOut: () => Promise<AuthActionResult>;
  clearError: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const isMobileLike = () => (
  typeof navigator !== 'undefined'
  && /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
);

const getErrorCode = (error: unknown) =>
  (typeof error === 'object' && error && 'code' in error ? String((error as any).code) : '');

const mapFirebaseAuthError = (error: unknown) => {
  const code = getErrorCode(error);

  if (code === 'auth/popup-closed-by-user') {
    return '로그인 창이 닫혔어요. 다시 한 번 시도해 주세요.';
  }
  if (code === 'auth/popup-blocked') {
    return '브라우저가 로그인 팝업을 막았어요. 팝업 허용 후 다시 시도해 주세요.';
  }
  if (code === 'auth/unauthorized-domain') {
    return '현재 도메인이 Firebase Authorized Domains에 등록되지 않았어요.';
  }
  if (code === 'auth/network-request-failed') {
    return '네트워크 연결이 불안정해요. 연결 상태를 확인한 뒤 다시 시도해 주세요.';
  }

  return '로그인 중 문제가 발생했어요. 잠시 후 다시 시도해 주세요.';
};

const mapKakaoAuthError = (error: unknown) => {
  const code = getErrorCode(error);
  const message = error instanceof Error ? error.message : String(error || '');

  if (code === 'KAKAO_NOT_CONFIGURED' || message.includes('KAKAO_NOT_CONFIGURED')) {
    return 'Kakao JavaScript 키가 아직 연결되지 않았어요.';
  }
  if (code === 'KAKAO_SDK_LOAD_FAILED' || message.includes('KAKAO_SDK_LOAD_FAILED')) {
    return 'Kakao SDK를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.';
  }
  if (code === 'KAKAO_AUTH_NOT_CONFIGURED' || message.includes('KAKAO_AUTH_NOT_CONFIGURED')) {
    return '서버에 Kakao REST API 키가 아직 연결되지 않았어요.';
  }
  if (code === 'KAKAO_REDIRECT_URI_MISMATCH' || message.includes('KAKAO_REDIRECT_URI_MISMATCH')) {
    return 'Kakao 개발자 콘솔에 현재 Redirect URI가 등록되지 않았어요.';
  }
  if (code === 'KAKAO_TOKEN_EXCHANGE_FAILED' || message.includes('KAKAO_TOKEN_EXCHANGE_FAILED')) {
    return '카카오 인증 코드 교환에 실패했어요. Kakao 로그인 활성화, Redirect URI, 동의항목 설정을 다시 확인해 주세요.';
  }
  if (code === 'KAKAO_PROFILE_FETCH_FAILED' || message.includes('KAKAO_PROFILE_FETCH_FAILED')) {
    return '카카오 프로필 정보를 가져오지 못했어요. 닉네임과 프로필 사진 동의항목을 확인해 주세요.';
  }
  if (message.includes('access_denied')) {
    return '카카오 로그인 권한 요청이 취소되었어요.';
  }
  if (message.includes('KAKAO_REDIRECT_STARTED')) {
    return '';
  }

  return '카카오 로그인 중 문제가 발생했어요. 잠시 후 다시 시도해 주세요.';
};

const toAuthIdentityRecord = (session: AppAuthSession) => ({
  provider: session.provider,
  providerAccountId: session.provider === 'kakao'
    ? session.userId.replace(/^kakao:/, '')
    : session.userId,
  displayName: session.displayName,
  email: session.email,
  photoURL: session.photoURL,
  lastLoginAt: session.lastLoginAt,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [session, setSessionState] = useState<AppAuthSession | null>(() => getAuthSession());
  const [error, setError] = useState<string | null>(null);
  const [pendingProvider, setPendingProvider] = useState<AuthProviderName | null>(null);

  const applySession = useCallback((nextSession: AppAuthSession | null) => {
    setSessionState(nextSession);
    setStatus(nextSession ? 'authenticated' : 'guest');
  }, []);

  useEffect(() => {
    let mounted = true;
    let unsubscribeFirebase = () => {};

    const initialize = async () => {
      if (auth) {
        try {
          await setPersistence(auth, browserLocalPersistence);
        } catch (setupError) {
          console.warn('Failed to set Firebase auth persistence:', setupError);
        }
      }

      const cachedSession = getAuthSession();
      const pendingKakaoCallback = hasPendingKakaoCallback();

      if (pendingKakaoCallback && mounted) {
        setPendingProvider('kakao');
      } else if (cachedSession?.provider === 'kakao' && mounted) {
        applySession(cachedSession);
      }

      if (pendingKakaoCallback) {
        try {
          const nextSession = await completeKakaoSignInFromRedirect();
          if (mounted) {
            setAuthSession(nextSession);
            applySession(nextSession);
            setError(null);
            setPendingProvider(null);
          }
        } catch (kakaoCallbackError) {
          if (mounted) {
            const nextError = mapKakaoAuthError(kakaoCallbackError);
            if (nextError) {
              setError(nextError);
            }
            setPendingProvider(null);
            if (!cachedSession) {
              setStatus('guest');
            }
          }
        }
      }

      if (!auth) {
        if (mounted && !cachedSession) {
          setStatus('guest');
        }
        return;
      }

      try {
        const redirectResult = await getRedirectResult(auth);
        if (redirectResult?.user && mounted) {
          setAuthSession(buildGoogleAuthSession(redirectResult.user));
        }
      } catch (redirectError) {
        if (mounted) {
          setError(mapFirebaseAuthError(redirectError));
        }
      }

      unsubscribeFirebase = onAuthStateChanged(auth, (user) => {
        if (!mounted) {
          return;
        }

        if (user) {
          setAuthSession(buildGoogleAuthSession(user));
          setPendingProvider(null);
          return;
        }

        const currentSession = getAuthSession();
        if (!currentSession || currentSession.provider === 'google') {
          clearAuthSession();
        } else {
          applySession(currentSession);
        }
        setPendingProvider(null);
      });

      if (!cachedSession && !auth.currentUser && !pendingKakaoCallback && mounted) {
        setStatus('guest');
      }
    };

    void initialize();

    const unsubscribeSession = subscribeToAuthSession((nextSession) => {
      if (!mounted) {
        return;
      }
      applySession(nextSession);
    });

    return () => {
      mounted = false;
      unsubscribeFirebase();
      unsubscribeSession();
    };
  }, [applySession]);

  useEffect(() => {
    api.cache.reconcileLaunchState();

    if (!session?.userId) {
      return;
    }

    void api.auth.upsertIdentity(toAuthIdentityRecord(session)).catch((syncError) => {
      console.warn('Failed to sync auth identity:', syncError);
    });
  }, [session]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const signInWithGoogle = useCallback(async (): Promise<AuthActionResult> => {
    if (!auth || !googleProvider || !isFirebaseReady) {
      const nextError = 'Firebase 설정이 완전하지 않아 Google 로그인을 사용할 수 없어요.';
      setError(nextError);
      return { ok: false, error: nextError };
    }

    setPendingProvider('google');
    setError(null);

    try {
      await setPersistence(auth, browserLocalPersistence);

      if (isMobileLike()) {
        await signInWithRedirect(auth, googleProvider);
        return { ok: true, redirected: true };
      }

      const result = await signInWithPopup(auth, googleProvider);
      setAuthSession(buildGoogleAuthSession(result.user));
      setPendingProvider(null);
      return { ok: true };
    } catch (popupError) {
      const popupCode = getErrorCode(popupError);

      if (popupCode === 'auth/popup-blocked' || popupCode === 'auth/operation-not-supported-in-this-environment') {
        try {
          await signInWithRedirect(auth, googleProvider);
          return { ok: true, redirected: true };
        } catch (redirectError) {
          const nextError = mapFirebaseAuthError(redirectError);
          setError(nextError);
          setPendingProvider(null);
          return { ok: false, error: nextError };
        }
      }

      const nextError = mapFirebaseAuthError(popupError);
      setError(nextError);
      setPendingProvider(null);
      return { ok: false, error: nextError };
    }
  }, []);

  const signInWithKakao = useCallback(async (): Promise<AuthActionResult> => {
    setPendingProvider('kakao');
    setError(null);

    try {
      await signInWithKakaoSdk();
      return { ok: true, redirected: true };
    } catch (kakaoError) {
      const nextError = mapKakaoAuthError(kakaoError);
      if (nextError) {
        setError(nextError);
      }
      setPendingProvider(null);
      return { ok: false, error: nextError };
    }
  }, []);

  const signOut = useCallback(async (): Promise<AuthActionResult> => {
    setError(null);
    setPendingProvider(session?.provider || 'google');

    try {
      if (session?.provider === 'kakao') {
        await signOutKakaoSdk();
        clearAuthSession();
      } else if (auth?.currentUser) {
        await firebaseSignOut(auth);
      } else {
        clearAuthSession();
      }

      setPendingProvider(null);
      return { ok: true };
    } catch (signOutError) {
      const nextError = session?.provider === 'kakao'
        ? mapKakaoAuthError(signOutError)
        : mapFirebaseAuthError(signOutError);
      setError(nextError);
      setPendingProvider(null);
      return { ok: false, error: nextError };
    }
  }, [session?.provider]);

  const value = useMemo<AuthContextValue>(() => ({
    status,
    session,
    error,
    pendingProvider,
    isGoogleReady: isFirebaseReady,
    isKakaoReady: kakaoEnv.enabled,
    signInWithGoogle,
    signInWithKakao,
    signOut,
    clearError,
  }), [clearError, error, pendingProvider, session, signInWithGoogle, signInWithKakao, signOut, status]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
