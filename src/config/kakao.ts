import { z } from 'zod';
import { clientEnv, normalizeClientEnvString } from './env';
import { buildKakaoAuthSession, type AppAuthSession } from '../services/authSession';
import { api } from '../services/api';

declare global {
  interface Window {
    Kakao?: {
      isInitialized: () => boolean;
      init: (appKey: string) => void;
      Auth: {
        authorize: (options: {
          redirectUri: string;
          scope?: string;
          state?: string;
          throughTalk?: boolean;
        }) => void;
        logout: (callback?: () => void) => void;
        setAccessToken?: (token: string) => void;
        getAccessToken?: () => string | null;
      };
      API: {
        request: (options: {
          url: string;
          data?: Record<string, unknown>;
          success: (response: unknown) => void;
          fail: (error: unknown) => void;
        }) => void;
      };
    };
  }
}

const kakaoClientEnvSchema = z.object({
  VITE_KAKAO_JAVASCRIPT_KEY: z.string().optional().default(''),
  VITE_KAKAO_REDIRECT_URI: z.string().optional().default(''),
});

const parsedKakaoEnv = kakaoClientEnvSchema.parse({
  VITE_KAKAO_JAVASCRIPT_KEY: normalizeClientEnvString(import.meta.env.VITE_KAKAO_JAVASCRIPT_KEY),
  VITE_KAKAO_REDIRECT_URI: normalizeClientEnvString(import.meta.env.VITE_KAKAO_REDIRECT_URI),
});

const KAKAO_SDK_URL = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.5/kakao.min.js';
const KAKAO_SCOPE = 'profile_nickname,profile_image';
const KAKAO_CALLBACK_PATH = '/auth/kakao/callback';
const KAKAO_RETURN_TO_KEY = 'sazoo_kakao_return_to_v1';

export const kakaoEnv = {
  javascriptKey: parsedKakaoEnv.VITE_KAKAO_JAVASCRIPT_KEY.trim(),
  redirectUri: parsedKakaoEnv.VITE_KAKAO_REDIRECT_URI.trim(),
  enabled: parsedKakaoEnv.VITE_KAKAO_JAVASCRIPT_KEY.trim().length > 0,
  appEnv: clientEnv.appEnv,
} as const;

let kakaoScriptPromise: Promise<NonNullable<Window['Kakao']>> | null = null;

const ensureBrowser = () => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('KAKAO_BROWSER_ONLY');
  }
};

const getKakaoRedirectUri = () => {
  ensureBrowser();
  if (kakaoEnv.redirectUri) {
    return kakaoEnv.redirectUri;
  }

  return new URL(KAKAO_CALLBACK_PATH, window.location.origin).toString();
};

const isKakaoCallbackPath = (pathname = window.location.pathname) => {
  try {
    return pathname === new URL(getKakaoRedirectUri()).pathname;
  } catch {
    return pathname === KAKAO_CALLBACK_PATH;
  }
};

const getStoredReturnTo = () => {
  ensureBrowser();
  return window.sessionStorage.getItem(KAKAO_RETURN_TO_KEY) || '/';
};

const setStoredReturnTo = (value: string) => {
  ensureBrowser();
  window.sessionStorage.setItem(KAKAO_RETURN_TO_KEY, value);
};

const clearStoredReturnTo = () => {
  ensureBrowser();
  window.sessionStorage.removeItem(KAKAO_RETURN_TO_KEY);
};

export const hasPendingKakaoCallback = () => {
  ensureBrowser();
  const params = new URLSearchParams(window.location.search);
  return isKakaoCallbackPath() && (params.has('code') || params.has('error'));
};

const consumeKakaoCallbackParams = () => {
  ensureBrowser();
  const params = new URLSearchParams(window.location.search);

  if (!isKakaoCallbackPath() || (!params.has('code') && !params.has('error'))) {
    return null;
  }

  const payload = {
    code: params.get('code') || '',
    error: params.get('error') || '',
    errorDescription: params.get('error_description') || '',
    state: params.get('state') || undefined,
    redirectUri: getKakaoRedirectUri(),
  };

  return payload;
};

export const loadKakaoSdk = async () => {
  ensureBrowser();

  if (!kakaoEnv.enabled) {
    throw new Error('KAKAO_NOT_CONFIGURED');
  }

  if (window.Kakao) {
    if (!window.Kakao.isInitialized()) {
      window.Kakao.init(kakaoEnv.javascriptKey);
    }
    return window.Kakao;
  }

  if (!kakaoScriptPromise) {
    kakaoScriptPromise = new Promise((resolve, reject) => {
      const existingScript = document.querySelector<HTMLScriptElement>(`script[src="${KAKAO_SDK_URL}"]`);
      if (existingScript) {
        existingScript.addEventListener('load', () => {
          if (!window.Kakao) {
            reject(new Error('KAKAO_SDK_LOAD_FAILED'));
            return;
          }
          if (!window.Kakao.isInitialized()) {
            window.Kakao.init(kakaoEnv.javascriptKey);
          }
          resolve(window.Kakao);
        }, { once: true });
        existingScript.addEventListener('error', () => reject(new Error('KAKAO_SDK_LOAD_FAILED')), { once: true });
        return;
      }

      const script = document.createElement('script');
      script.src = KAKAO_SDK_URL;
      script.async = true;
      script.onload = () => {
        if (!window.Kakao) {
          reject(new Error('KAKAO_SDK_LOAD_FAILED'));
          return;
        }
        if (!window.Kakao.isInitialized()) {
          window.Kakao.init(kakaoEnv.javascriptKey);
        }
        resolve(window.Kakao);
      };
      script.onerror = () => reject(new Error('KAKAO_SDK_LOAD_FAILED'));
      document.head.appendChild(script);
    }).catch((error) => {
      kakaoScriptPromise = null;
      throw error;
    });
  }

  return kakaoScriptPromise;
};

export const signInWithKakaoSdk = async (): Promise<void> => {
  const kakao = await loadKakaoSdk();
  const returnTo = `${window.location.pathname}${window.location.search}${window.location.hash}` || '/';

  if (!isKakaoCallbackPath(window.location.pathname)) {
    setStoredReturnTo(returnTo);
  }

  kakao.Auth.authorize({
    redirectUri: getKakaoRedirectUri(),
    scope: KAKAO_SCOPE,
    state: clientEnv.appEnv,
  });
};

export const completeKakaoSignInFromRedirect = async (): Promise<AppAuthSession> => {
  const callback = consumeKakaoCallbackParams();
  if (!callback) {
    throw new Error('KAKAO_INVALID_CALLBACK');
  }

  if (callback.error) {
    throw new Error(callback.errorDescription || callback.error || 'KAKAO_LOGIN_FAILED');
  }

  const exchange = await api.auth.exchangeKakaoCode(callback.code, callback.redirectUri, callback.state);
  const session = buildKakaoAuthSession(exchange.profile);

  if (window.Kakao?.Auth?.setAccessToken) {
    window.Kakao.Auth.setAccessToken(exchange.accessToken);
  }

  const returnTo = getStoredReturnTo();
  clearStoredReturnTo();
  window.history.replaceState({}, document.title, returnTo || '/');

  return session;
};

export const signOutKakaoSdk = async () => {
  if (!window.Kakao?.Auth) {
    return;
  }

  await new Promise<void>((resolve) => {
    try {
      window.Kakao?.Auth.logout(() => resolve());
      window.setTimeout(() => resolve(), 1200);
    } catch {
      resolve();
    }
  });
};
